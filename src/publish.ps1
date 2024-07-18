
$currentDirectoryPath = (Get-Location).Path
Write-Output $currentDirectoryPath


#function main() {
#  srcDir="$(pwd)"
#  buildDir="$(dirname $srcDir)/docs"
#
#  rm -rf "$buildDir"
#  mkdir -p "$buildDir"
#
#  css=$(cat "$srcDir/_assets/css/styles.css")
#  css=$(prependTabs "$css" 2)
#  #echo -e "$css"
#
#
#  mapfile -t files < <(find . -wholename "*.html" -type f -not -path "*/_components/*")
#  for file in "${files[@]}"; do
#    processHtml "$file" "$css"
#  done
#
#  echo "Build completed"
#}
#
#
#
#function processHtml() {
#  file=$1
#  css=$2
#  #echo "$file"
#  publishFile="$buildDir/${file:2}"
#  #echo "$publishFile"
#  html=$(cat "$file")
#
#  html="$(echo "$html" | sed "s/<link rel=\"stylesheet\" href=\"\/_assets\/css\/styles.css\">/<style>$(echo -e \"$css\")\t<\/style>/g")"
#
#  html="$(echo "$html" | sed 's/"\/_assets/"https:\/\/raw.githubusercontent.com\/jurakovic\/meteo\/main\/src\/_assets/g')"
#  html="$(echo "$html" | sed 's/"\/_components/"https:\/\/raw.githubusercontent.com\/jurakovic\/meteo\/main\/src\/_components/g')"
#  mkdir -p "$(dirname $publishFile)"
#  echo -e "$html" > "$publishFile"
#}
#
#function prependTabs() {
#  local str="$1"
#  local num="$2"
#  local char="\t"
#
#  # Create a string with the character repeated 'num' times
#  local prefix=$(printf "%${num}s" | tr ' ' "$char")
#
#  # Read the input string line by line
#  while IFS= read -r line; do
#      if [ -n "$line" ]; then
#          echo "$prefix$line"
#      else
#          echo "$line"
#      fi
#  done <<< "$str"
#}


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




#function prependTabs(inputString, num) {
#	const lines = inputString.split('\r\n');
#	const prependedLines = lines.map(line => (line.length > 0 ? '\t'.repeat(num) + line : line));
#	return prependedLines.join('\r\n');
#}
#
#build().then(() => {
#	console.log('Build completed.');

#}).catch(err => {
#	console.error('Error during build:', err);
#});


main
