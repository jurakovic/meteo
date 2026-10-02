// The manual's Markdown subset: what it renders, and what it refuses
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertManual, inline, slug } from '../../scripts/manual.mjs';

test('slugs keep letters of every alphabet and drop punctuation', () => {
	assert.equal(slug('Nadzorna ploča'), 'nadzorna-ploča');
	assert.equal(slug('Karte na stranici!'), 'karte-na-stranici');
	assert.equal(slug('  A  (b)  c '), 'a-b-c');
});

test('inline markup: code first, bold before italic, links, kbd', () => {
	assert.equal(inline('`[R]` **jako** *malo*'), '<code>[R]</code> <strong>jako</strong> <em>malo</em>');
	assert.equal(inline('`*a*` & <kbd>Esc</kbd>'), '<code>*a*</code> &amp; <kbd>Esc</kbd>');
	assert.equal(inline('[Upute](#upute)'), '<a href="#upute">Upute</a>');
});

test('inline markup outside the subset throws', () => {
	assert.throws(() => inline('<b>x</b>'), /HTML tag other than <kbd>/);
	assert.throws(() => inline('**open'), /unpaired \*/);
	assert.throws(() => inline('[a](b'), /malformed link/);
});

test('blocks: the title dropped, headings in the contents, lists, tables, quotes, paragraphs', () => {
	const html = convertManual([
		'# Upute', '',
		'## Prvo', 'Jedan', 'red.', '',
		'- a', '- *b*', '',
		'### Drugo', '',
		'| Gumb | Značenje |', '|---|---|', '| `[R]` | osvježi |', '',
		'> pazi', '> dobro'
	].join('\r\n'));
	assert.deepEqual(html, [
		'<nav class="manual-toc">', '<ul>',
		'<li class="toc-2"><a href="#prvo">Prvo</a></li>',
		'<li class="toc-3"><a href="#drugo">Drugo</a></li>',
		'</ul>', '</nav>',
		'<h2 id="prvo">Prvo</h2>', '<p>Jedan red.</p>',
		'<ul>', '<li>a</li>', '<li><em>b</em></li>', '</ul>',
		'<h3 id="drugo">Drugo</h3>',
		'<table>', '<thead>', '<tr><th>Gumb</th><th>Značenje</th></tr>', '</thead>',
		'<tbody>', '<tr><td><code>[R]</code></td><td>osvježi</td></tr>', '</tbody>', '</table>',
		'<blockquote><p>pazi dobro</p></blockquote>'
	]);
});

test('blocks outside the subset throw, naming the line', () => {
	for (const [line, message] of [
		['    code', /indented line \(line 3\)/],
		['```', /code fence/],
		['* item', /use - for a list/],
		['1. item', /numbered list/],
		['---', /horizontal rule/],
		['#### deep', /heading below ###/],
		['<div>', /HTML block/],
		['-5 stupnjeva', /opens like a block/]
	]) {
		assert.throws(() => convertManual(`## H\n\n${line}\n`), message, line);
	}
	assert.throws(() => convertManual('| a |\n| b |\n'), /table without a delimiter row/);
	assert.throws(() => convertManual('samo tekst\n'), /no headings/);
});

test('the real manual converts', async () => {
	const { readFile } = await import('node:fs/promises');
	const html = convertManual(await readFile(new URL('../../MANUAL.md', import.meta.url), 'utf8'));
	assert.ok(html.length > 50);
	assert.ok(html.includes('<h2 id="nadzorna-ploča">Nadzorna ploča</h2>'));
});
