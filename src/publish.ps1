
#function main() {
function Main {
	#  srcDir="$(pwd)"
	$srcDir = (Get-Location).Path
	#  buildDir="$(dirname $srcDir)/docs"
	$buildDir = "$(Split-Path (Get-Location).Path -Parent)\docs"

	Write-Output "$srcDir"
	Write-Output "$buildDir"

	#  rm -rf "$buildDir"
	Remove-Item -Path "$buildDir" -Recurse -Force

	#  mkdir -p "$buildDir"
	New-Item -ItemType Directory -Path "$buildDir" -Force > $null

	#  css=$(cat "$srcDir/_assets/css/styles.css")
	$css = Get-Content "$srcDir\_assets\css\styles.css" -Raw -Encoding "utf8"
	#Write-Output "$css"
	#  css=$(prependTabs "$css" 2)
	$css = Prepend-Tabs -str $css -num 2
	#  #echo -e "$css"
	#Write-Output "$css"

#  mapfile -t files < <(find . -wholename "*.html" -type f -not -path "*/_components/*")
#  for file in "${files[@]}"; do
#    processHtml "$file" "$css"
#  done

    # Find all .html files excluding those in _components directories
    $files = Get-ChildItem -Path $directory -Recurse -Filter *.html | Where-Object { $_.FullName -notmatch "\\_components\\" }

    # Print each file path
    foreach ($file in $files) {
        ProcessHtml $file.FullName $css
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
        [string]$file,
        [string]$css
    )
#  #echo "$file"
    Write-Output $file
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
    $str -split "`n" | ForEach-Object {
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
