
const fs = require('fs-extra');
const path = require('path');

const srcDir = __dirname; // src
const buildDir = path.join(__dirname, '../publish');

async function build() {
	// Clean build directory
	await fs.emptyDir(buildDir);

	// Copy images to build directory
	await fs.copy(path.join(__dirname, '_assets/img'), path.join(buildDir, 'img'));

	// Read and inline CSS
	let css = await fs.readFile(path.join(srcDir, '_assets/css', 'styles.css'), 'utf-8');
	css = prependTabs(css, 2);

	// Read and inline JavaScript
	let js = await fs.readFile(path.join(srcDir, '_assets/js', 'include.js'), 'utf-8');
	js = prependTabs(js, 2);

	// Process HTML files
	const processHTML = async (filePath) => {
		let html = await fs.readFile(filePath, 'utf-8');

		html = html.replace('<link rel="stylesheet" href="/_assets/css/styles.css">', `<style>${css}\t</style>`);
		html = html.replace('<script src="/_assets/js/include.js" defer></script>', `<script>${js}\t</script>`);
		html = html.replace('href="/_assets/img', `href="/img`);
		html = html.replace(`document.addEventListener('DOMContentLoaded', includeHTML);`, `//document.addEventListener('DOMContentLoaded', includeHTML);`); // comment out not needed js in standalone html
		html = html.replace('<!--<img src="https://bit', '<img src="https://bit');
		html = html.replace('right" />-->', 'right" />');

		let links = await fs.readFile(path.join(srcDir, '_components', 'links.html'), 'utf-8');
		links = prependTabs(links, 5);
		html = html.replace('<div class="content" data-include-html="/_components/links.html"></div>', `<div class="content">${links}\t\t\t\t</div>`);

		// Write to build directory
		const relativePath = path.relative(srcDir, filePath);
		const buildFilePath = path.join(buildDir, relativePath);
		await fs.ensureDir(path.dirname(buildFilePath));
		await fs.writeFile(buildFilePath, html);
	};

	// Process each HTML file
	await processHTML(path.join(srcDir, 'index.html'));
	await processHTML(path.join(srcDir, 'extras', 'index.html'));
}

function prependTabs(inputString, num) {
	const lines = inputString.split('\r\n');
	const prependedLines = lines.map(line => (line.length > 0 ? '\t'.repeat(num) + line : line));
	return prependedLines.join('\r\n');
}

build().then(() => {
	console.log('Build completed.');
}).catch(err => {
	console.error('Error during build:', err);
});
