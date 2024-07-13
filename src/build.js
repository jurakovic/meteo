console.log("foo");

const fs = require('fs-extra');
const path = require('path');
const format = require('html-format');

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
    const css = await fs.readFile(path.join(srcDir, '_assets/css', 'styles.css'), 'utf-8');

	//console.log(css);
	//return;

    // Read and inline JavaScript
    const js = await fs.readFile(path.join(srcDir, '_assets/js', 'include.js'), 'utf-8');

	//console.log(js);
	//return;

    // Process HTML files
    const processHTML = async (filePath) => {
        let html = await fs.readFile(filePath, 'utf-8');

        // Inline CSS and JavaScript
        html = html.replace('<link rel="stylesheet" href="/_assets/css/styles.css">', `<style>${css}</style>`);
        html = html.replace('<script src="/_assets/js/include.js" defer></script>', `<script>${js}</script>`);
        html = html.replace('href="/_assets/img', `href="/img`);
        html = html.replace(`document.addEventListener('DOMContentLoaded', includeHTML);`, `//document.addEventListener('DOMContentLoaded', includeHTML);`);

        // Inline components
        html = await inlineComponents(html);
        html = format(html);

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
            const componentContent = await fs.readFile(componentPath, 'utf-8');
            html = html.replace(match[0], componentContent);
        }
        return html;
    };

    // Process each HTML file
    await processHTML(path.join(srcDir, 'index.html'));
    await processHTML(path.join(srcDir, 'extras', 'index.html'));
}

build().then(() => {
    console.log('Build completed.');
}).catch(err => {
    console.error('Error during build:', err);
});


