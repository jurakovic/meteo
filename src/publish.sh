
#const fs = require('fs-extra');
#const path = require('path');
#
#const srcDir = __dirname; // src
#const buildDir = path.join(__dirname, '../docs');

srcDir="$(pwd)"
buildDir="$(dirname $srcDir)/docs"

#echo "$srcDir"
#echo "$buildDir"

#read -p "Press any key to continue..." -n1 -s; echo

#async function build() {
#	// Clean build directory
#	await fs.emptyDir(buildDir);

rm -rf "$buildDir"
mkdir -p "$buildDir"



#	// Copy images to build directory
#	await fs.copy(path.join(__dirname, '_assets/img'), path.join(buildDir, 'img'));

#cp -r "$srcDir/_assets/img" "$buildDir/img/"

#	// Read and inline CSS
#	let css = await fs.readFile(path.join(srcDir, '_assets/css', 'styles.css'), 'utf-8');
#	css = prependTabs(css, 2);
#
#	// Read and inline JavaScript
#	let js = await fs.readFile(path.join(srcDir, '_assets/js', 'include.js'), 'utf-8');
#	js = prependTabs(js, 2);


#	// Process HTML files
#	const processHTML = async (filePath) => {
#		let html = await fs.readFile(filePath, 'utf-8');
#
#		html = html.replaceAll('<link rel="stylesheet" href="/_assets/css/styles.css">', `<style>${css}\t</style>`);
#		html = html.replaceAll('<script src="/_assets/js/include.js" defer></script>', `<script>${js}\t</script>`);
#		html = html.replaceAll('href="/_assets/img', `href="/meteo/img`);
#		html = html.replaceAll(`document.addEventListener('DOMContentLoaded', includeHTML);`, `//document.addEventListener('DOMContentLoaded', includeHTML);`); // comment out not needed js in standalone html
#		html = html.replaceAll('<!--<img src="https://bit', '<img src="https://bit');
#		html = html.replaceAll('right" />-->', 'right" />');
#
#		let links = await fs.readFile(path.join(srcDir, '_components', 'links.html'), 'utf-8');
#		links = prependTabs(links, 5);
#		html = html.replaceAll('<div class="content" data-include-html="/_components/links.html"></div>', `<div class="content">${links}\t\t\t\t</div>`);
#
#		// Write to build directory
#		const relativePath = path.relative(srcDir, filePath);
#		const buildFilePath = path.join(buildDir, relativePath);
#		await fs.ensureDir(path.dirname(buildFilePath));
#		await fs.writeFile(buildFilePath, html);
#	};
#
#	// Process each HTML file
#	await processHTML(path.join(srcDir, 'index.html'));
#	await processHTML(path.join(srcDir, 'extras', 'index.html'));
#}

mapfile -t files < <(find . -wholename "*.html" -type f -not -path "*/_components/*")
for file in "${files[@]}"; do
  #echo "$file"
  publishFile="$buildDir/${file:2}"
  #echo "$publishFile"
  html=$(cat "$file")
  html="$(echo "$html" | sed 's/"\/_assets/"https:\/\/raw.githubusercontent.com\/jurakovic\/meteo\/main\/src\/_assets/g')"
  html="$(echo "$html" | sed 's/"\/_components/"https:\/\/raw.githubusercontent.com\/jurakovic\/meteo\/main\/src\/_components/g')"
  mkdir -p "$(dirname $publishFile)"
  echo -e "$html" > "$publishFile"
done


#function prependTabs(inputString, num) {
#	const lines = inputString.split('\r\n');
#	const prependedLines = lines.map(line => (line.length > 0 ? '\t'.repeat(num) + line : line));
#	return prependedLines.join('\r\n');
#}
#
#build().then(() => {
#	console.log('Build completed.');

echo "Build completed"

#}).catch(err => {
#	console.error('Error during build:', err);
#});
