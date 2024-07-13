console.log("foo");

const fs = require('fs-extra');
const path = require('path');

console.log(__dirname);

//return;

const srcDir = __dirname; //path.join(__dirname, 'src');
const buildDir = path.join(__dirname, '../site');

console.log("srcDir: " + srcDir);
console.log("buildDir: " + buildDir);

//return;

async function build() {
    // Clean build directory
    await fs.emptyDir(buildDir);

    // Copy images to build directory
    await fs.copy(path.join(__dirname, '_assets/img'), path.join(buildDir, 'img'));

	//return;

    // Read and inline CSS
    const _css = await fs.readFile(path.join(srcDir, '_assets/css', 'styles.css'), 'utf-8');
	const css = prependCharacterToLines(_css, '\t', 2);

	//console.log(css);
	//return;

    // Read and inline JavaScript
    const _js = await fs.readFile(path.join(srcDir, '_assets/js', 'include.js'), 'utf-8');
	const js = prependCharacterToLines(_js, '\t', 2);

	//console.log(js);
	//return;

    // Process HTML files
    const processHTML = async (filePath) => {
        let html = await fs.readFile(filePath, 'utf-8');

        // Inline CSS and JavaScript
        html = html.replace('<link rel="stylesheet" href="/_assets/css/styles.css">', `<style>${css}\t</style>`);
        html = html.replace('<script src="/_assets/js/include.js" defer></script>', `<script>${js}\t</script>`);
        html = html.replace('href="/_assets/img', `href="/img`);
        html = html.replace(`document.addEventListener('DOMContentLoaded', includeHTML);`, `//document.addEventListener('DOMContentLoaded', includeHTML);`);

        // Inline components
        //html = await inlineComponents(html);
		const _links = await fs.readFile(path.join(srcDir, '_includes', 'links.html'), 'utf-8');
		const links = prependCharacterToLines(_links, '\t', 5);
		html = html.replace('<div class="content" data-include-html="/_includes/links.html"></div>', `<div class="content">${links}\t\t\t\t</div>`);

        // Write to build directory
        const relativePath = path.relative(srcDir, filePath);
        const buildFilePath = path.join(buildDir, relativePath);
        await fs.ensureDir(path.dirname(buildFilePath));
        await fs.writeFile(buildFilePath, html);
    };

    const inlineComponents = async (html) => {
        const componentRegex = /<div class="content" data-include-html="(.+?)"><\/div>/g;
        let match;
        while ((match = componentRegex.exec(html)) !== null) {
            const componentPath = path.join(srcDir, match[1]);
            const _componentContent = await fs.readFile(componentPath, 'utf-8');
            const componentContent = prependCharacterToLines(_componentContent, '\t', 4);
            html = html.replace(match[0], componentContent);
        }
        return html;
    };

    // Process each HTML file
    await processHTML(path.join(srcDir, 'index.html'));
    await processHTML(path.join(srcDir, 'extras', 'index.html'));
}

function prependCharacterToLines(inputString, char, num) {
    // Split the input string into an array of lines
    const lines = inputString.split('\r\n');

    // Prepend each line with the character repeated 'num' times
    //const prependedLines = lines.map(line => char.repeat(num) + line);
    const prependedLines = lines.map(line => (line.length > 0 ? char.repeat(num) + line : line));

    // Join the array of lines back into a single string
    return prependedLines.join('\r\n');
}

build().then(() => {
    console.log('Build completed.');
}).catch(err => {
    console.error('Error during build:', err);
});
