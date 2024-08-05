
#function main() {
function Main {
	#  srcDir="$(pwd)"
	$srcDir = (Get-Location).Path
	#  buildDir="$(dirname $srcDir)/docs"
	$buildDir = "$(Split-Path (Get-Location).Path -Parent)\docs"

	Write-Output "$srcDir"
	Write-Output "$buildDir"

	#  rm -rf "$buildDir"
	Remove-Item -Path "$buildDir" -Recurse -Force -ErrorAction SilentlyContinue

	#  mkdir -p "$buildDir"
	New-Item -ItemType Directory -Path "$buildDir" -Force > $null

	Copy-Item -Path "$srcDir\_assets\img\" -Destination "$buildDir\img\" -Recurse

	#  css=$(cat "$srcDir/_assets/css/styles.css")
	$css = Get-Content "$srcDir\_assets\css\styles.css" -Raw -Encoding "utf8"
	#Write-Output $css | Set-Content -Path "$srcDir\_assets\css\styles1.css"
	#Write-Output "$css"
	#  css=$(prependTabs "$css" 2)
	$css = Prepend-Tabs -str $css -num 2
	#Write-Output $css | Set-Content -Path "$srcDir\_assets\css\styles2.css"
	#  #echo -e "$css"
	#Write-Output "$css"

	#let js = await fs.readFile(path.join(srcDir, '_assets/js', 'include.js'), 'utf-8');
	#js = prependTabs(js, 2);

	$js = Get-Content "$srcDir\_assets\js\include.js" -Raw -Encoding "utf8"
	$js = Prepend-Tabs -str $js -num 2

     #let links = await fs.readFile(path.join(srcDir, '_components', 'links.html'), 'utf-8');
	#links = prependTabs(links, 5);
    $links = Get-Content "$srcDir\_components\links.html" -Raw -Encoding "utf8"
	$links = Prepend-Tabs -str $links -num 5


#  mapfile -t files < <(find . -wholename "*.html" -type f -not -path "*/_components/*")
#  for file in "${files[@]}"; do
#    processHtml "$file" "$css"
#  done

    # Find all .html files excluding those in _components directories
    $files = Get-ChildItem -Path $directory -Recurse -Filter *.html | Where-Object { $_.FullName -notmatch "\\_components\\" }

    # Print each file path
    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($srcDir.Length).TrimStart('\')
        ProcessHtml $buildDir $relativePath $css $js $links
    }



#
#  echo "Build completed"
#}
}
#
#
#
function ProcessHtml() {
#  file=$1
#  css=$2
    param (
        [string]$buildDir,
        [string]$file,
        [string]$css,
        [string]$js,
        [string]$links
    )
#  #echo "$file"
    Write-Output $file
#  publishFile="$buildDir/${file:2}"
    $publishFile = "$buildDir\$file"
#  #echo "$publishFile"
    Write-Output $publishFile
#  html=$(cat "$file")
    $html = Get-Content "$file" -Raw -Encoding "utf8"
#

	#html = html.replaceAll('<div class="content" data-include-html="/_components/links.html"></div>', `<div class="content">${links}\t\t\t\t</div>`);
    $html = $html.Replace('<div class="content" data-include-html="/_components/links.html"></div>', "<div class=""content"">$links`t`t`t`t</div>")

    #html = html.replaceAll('href="/_assets/img', `href="/meteo/img`);
    $html = $html.Replace('href="/_assets/img', 'href="/meteo/img')

#  html="$(echo "$html" | sed "s/<link rel=\"stylesheet\" href=\"\/_assets\/css\/styles.css\">/<style>$(echo -e \"$css\")\t<\/style>/g")"
    $html = $html.Replace('<link rel="stylesheet" href="/_assets/css/styles.css">', "<style>$css`t</style>")
    #html = html.replaceAll('<script src="/_assets/js/include.js" defer></script>', `<script>${js}\t</script>`);
    $html = $html.Replace('<script src="/_assets/js/include.js" defer></script>', "<script>$js`t</script>")
    #Write-Output $html
#  html="$(echo "$html" | sed 's/"\/_assets/"https:\/\/raw.githubusercontent.com\/jurakovic\/meteo\/main\/src\/_assets/g')"
    #$html = $html.Replace('"/_assets', '"https://raw.githubusercontent.com/jurakovic/meteo/main/src/_assets')
#  html="$(echo "$html" | sed 's/"\/_components/"https:\/\/raw.githubusercontent.com\/jurakovic\/meteo\/main\/src\/_components/g')"
    $html = $html.Replace('"/_components', '"https://raw.githubusercontent.com/jurakovic/meteo/main/src/_components')

    #html = html.replaceAll(`document.addEventListener('DOMContentLoaded', includeHTML);`, `//document.addEventListener('DOMContentLoaded', includeHTML);`); // comment out not needed js in standalone html
    $html = $html.Replace("document.addEventListener('DOMContentLoaded', includeHTML);", "//document.addEventListener('DOMContentLoaded', includeHTML);")

    #html = html.replaceAll('<!--<img src="https://bit', '<img src="https://bit');
    $html = $html.Replace('<!--<img src="https://bit', '<img src="https://bit')

    #html = html.replaceAll('right" />-->', 'right" />');
    $html = $html.Replace('right" />-->', 'right" />')


#  mkdir -p "$(dirname $publishFile)"
    #New-Item -ItemType Directory -Path "$(Split-Path -Path $publishFile)" -Force > $null
    mkdir -Force "$(Split-Path -Path $publishFile)" | Out-Null
#  echo -e "$html" > "$publishFile"
    Write-Output $html | Set-Content -NoNewline -Path "$publishFile" -Encoding "utf8"
}
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


function Prepend-Tabs {
    param (
        [string]$str,
        [int]$num
    )

    # Define the character to prepend (tab character)
    $char = "`t"

    # Create a string with the character repeated 'num' times
    $prefix = ($char * $num)

    # Initialize an array to hold the processed lines
    $output = @()

    # Split the input string into lines and process each line
    $str -split "`r`n" | ForEach-Object {
        if ($_ -ne "") {
            $output += "$prefix$_"
        } else {
            $output += "$_"
        }
    }

    # Join the array into a single string with newline separators and return
    return $output -join "`r`n"
}

Main
