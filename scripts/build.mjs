// Builds docs/ (the GitHub Pages site) from src/: every page with its CSS and
// its script (the page's entry module, bundled) minified and inlined, the
// shared fragments and the manual put in,
// dev paths rewritten to the site's /meteo/ ones, comments stripped. Output is
// CRLF, as the rest of the repository is.
//
//   npm run build
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build as esbuild } from 'esbuild';
import { parseHTML } from 'linkedom';
import { minify } from 'terser';
import CleanCSS from 'clean-css';
import { convertChangelog } from './changelog.mjs';
import { convertManual } from './manual.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const src = join(root, 'src');
const out = join(root, 'docs');
const CRLF = '\r\n';

async function readText(file) {
	return (await readFile(file, 'utf8')).replace(/^\uFEFF/, '');
}

function toCrlf(text) {
	return text.replace(/\r?\n/g, CRLF);
}

// every non-empty line indented by num tabs — the line at `skip` by one less
// (a fragment put in after the placeholder's own indentation). Lines are CRLF
// ones: a fragment with LF endings is one line to this
function indent(text, num, skip = -1) {
	return text.split(CRLF).map((line, i) => {
		if (line === '') return line;
		return '\t'.repeat(i === skip ? num - 1 : num) + line;
	}).join(CRLF);
}

// the pages' entry modules, each bundled with everything it imports into one
// script: inlined into <head>, where it runs before the body exists (which
// the entries are written for). esbuild bundles and terser minifies: esbuild's
// own line limit breaks lines inside string literals, where the indentation
// below would then land, and terser's does not
const ENTRIES = ['landing', 'customize'];

async function bundleJs(name) {
	const bundled = await esbuild({
		entryPoints: [join(src, '_assets/js', `${name}.js`)],
		bundle: true,
		format: 'iife',
		charset: 'utf8',
		target: 'es2020',
		write: false
	});
	const result = await minify(bundled.outputFiles[0].text, { compress: true, mangle: true, format: { max_line_len: 140 } });
	return toCrlf(result.code);
}

async function minifyCss(name) {
	const css = await readText(join(src, '_assets/css', `${name}.css`));
	const result = new CleanCSS({ format: { wrapAt: 140 } }).minify(css);
	if (result.errors.length) throw new Error(result.errors.join('\n'));
	return toCrlf(result.styles);
}

const VOID_ELEMENTS = new Set(['img', 'input', 'br', 'source']);

function escapeText(text) {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

// linkedom lists attributes last set first, so they are reversed back to the
// order the renderer sets them in
function openTag(node) {
	const attrs = [...node.attributes].reverse()
		.map(attr => ` ${attr.name}="${attr.value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`);
	return `<${node.localName}${attrs.join('')}>`;
}

function serialize(node) {
	if (node.nodeType === 3) return escapeText(node.textContent);
	if (node.nodeType !== 1) return '';
	if (VOID_ELEMENTS.has(node.localName)) return openTag(node);
	return `${openTag(node)}${[...node.childNodes].map(serialize).join('')}</${node.localName}>`;
}

// an element as indented lines: one holding only elements opens and closes on
// lines of its own around them, one with any text in it is a single line
function formatElement(node, depth) {
	const pad = '\t'.repeat(depth);
	const children = [...node.childNodes];
	if (!children.length || children.some(child => child.nodeType !== 1) || VOID_ELEMENTS.has(node.localName)) {
		return [pad + serialize(node)];
	}
	return [
		pad + openTag(node),
		...children.flatMap(child => formatElement(child, depth + 1)),
		`${pad}</${node.localName}>`
	];
}

// the landing page's map rows, drawn by the page's own renderer under linkedom,
// so the built page shows its maps before (and without) its script
async function landingRows() {
	const { document } = parseHTML('<!DOCTYPE html><html><body></body></html>');
	globalThis.document = document;
	const module = (path) => import(pathToFileURL(join(src, '_assets/js', path)).href);
	const { catalogMap, DEFAULT_MAPS } = await module('maps/catalog.js');
	const { renderMapRows } = await module('maps/render.js');
	const list = document.createElement('div');
	renderMapRows(list, DEFAULT_MAPS.map(catalogMap).filter(Boolean));
	delete globalThis.document;
	return [...list.children].flatMap(entry => formatElement(entry, 4)).join(CRLF);
}

async function htmlFiles(dir) {
	const files = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name !== '_components' && entry.name !== 'node_modules') files.push(...await htmlFiles(path));
		} else if (entry.name.endsWith('.html')) {
			files.push(path);
		}
	}
	return files;
}

function processHtml(html, parts) {
	const replacements = [
		// the documents first, so a path they grow later is rewritten with the rest
		['<div class="dialog-body" data-include-html="/_components/manual.c.html">', '<div class="dialog-body">'],
		['<!-- manual -->', parts.manual],
		['<div class="dialog-body" data-include-html="/_components/changelog.c.html">', '<div class="dialog-body">'],
		['<!-- changelog -->', parts.changelog],
		['href="/_assets/img', 'href="/meteo/img'],
		['src="/_assets/img', 'src="/meteo/img'],
		['href="/customize/index.html', 'href="/meteo/customize/'],
		['url=/customize/index.html', 'url=/meteo/customize/'],
		['href="/"', 'href="/meteo/"'],
		['<link rel="stylesheet" href="/_assets/css/styles.css">', `<style>${CRLF}${parts.css}${CRLF}\t</style>`],
		...ENTRIES.map(name =>
			[`<script type="module" src="/_assets/js/${name}.js"></script>`, `<script>${CRLF}${parts.js[name]}${CRLF}\t</script>`]),
		['<script src="/_assets/js/include.js" defer></script>', ''],
		['<!-- seo -->', parts.seo],
		['<!-- gtag -->', parts.gtag],
		['<div class="links" data-include-html="/_components/links.c.html"></div>', `<div class="links">${parts.links}\t\t\t\t\t</div>`],
		['<!-- cnt -->', '<img src="https://bit.ly/radari-counter" style="width:1px;height:1px;float:right" />'],
		['right" />-->', 'right" />']
	];
	for (const [from, to] of replacements) html = html.replaceAll(from, () => to);
	html = html.replace(/<!--[\s\S]*?-->/g, '');
	html = html.split(CRLF).map(line => line.trimEnd()).join(CRLF);
	html = html.replace(/(\r\n){3,}/g, CRLF + CRLF);
	html = html.replaceAll(`</script>${CRLF}${CRLF}`, `</script>${CRLF}`);
	return toCrlf(html);
}

async function build() {
	const component = (name) => readText(join(src, '_components', `${name}.c.html`));
	const manualHtml = convertManual(await readText(join(root, 'MANUAL.hr.md'))).join(CRLF);
	// the dev pages fetch the documents from here (git-ignored: build output)
	await writeFile(join(src, '_components/manual.c.html'), manualHtml);
	const changelogHtml = convertChangelog(await readText(join(root, 'CHANGELOG.hr.md'))).join(CRLF);
	await writeFile(join(src, '_components/changelog.c.html'), changelogHtml);

	const parts = {
		css: indent(await minifyCss('styles'), 2),
		js: Object.fromEntries(await Promise.all(ENTRIES.map(async name => [name, indent(await bundleJs(name), 2)]))),
		seo: indent(await component('seo'), 1, 0),
		gtag: indent(await component('gtag'), 1, 0),
		links: indent(await component('links'), 6),
		manual: indent(manualHtml, 3),
		changelog: indent(changelogHtml, 3)
	};
	const landing = join(src, 'index.html');
	const rows = `<div class="maps-list" data-maps>${CRLF}${await landingRows()}${CRLF}\t\t\t</div>`;

	await rm(out, { recursive: true, force: true });
	await mkdir(out, { recursive: true });
	await cp(join(src, '_assets/img'), join(out, 'img'), { recursive: true });

	for (const file of await htmlFiles(src)) {
		const target = join(out, relative(src, file));
		await mkdir(dirname(target), { recursive: true });
		let html = await readText(file);
		// before processHtml, so the rows' paths are rewritten with the page's
		if (file === landing) html = html.replace('<div class="maps-list" data-maps></div>', () => rows);
		await writeFile(target, processHtml(html, parts));
		console.log(`built ${relative(root, target)}`);
	}
}

build().catch(error => {
	console.error(error);
	process.exit(1);
});
