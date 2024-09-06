
function Main {
	$srcDir = (Get-Location).Path
	$buildDir = "$(Split-Path (Get-Location).Path -Parent)\docs"

	# Clean build directory
	Remove-Item -Path "$buildDir" -Recurse -Force -ErrorAction SilentlyContinue

	New-Item -ItemType Directory -Path "$buildDir" -Force > $null

	# Copy images to build directory
	Copy-Item -Path "$srcDir\_assets\img\" -Destination "$buildDir\img\" -Recurse

	# Read and inline CSS
	$css = Get-Content "$srcDir\_assets\css\styles.css" -Raw -Encoding "utf8"
	$css = Prepend-Tabs -str $css -num 2

	# Read and inline JavaScript
	$js = Get-Content "$srcDir\_assets\js\main.js" -Raw -Encoding "utf8"
	$js = Prepend-Tabs -str $js -num 2

	$links = Get-Content "$srcDir\_components\links.html" -Raw -Encoding "utf8"
	$links = Prepend-Tabs -str $links -num 6

	# Find all .html files excluding those in _components directories
	$files = Get-ChildItem -Path $directory -Recurse -Filter *.html | Where-Object { $_.FullName -notmatch "\\_components\\" }

	# Print each file path
	foreach ($file in $files) {
		$relativePath = $file.FullName.Substring($srcDir.Length).TrimStart('\')
		ProcessHtml $buildDir $relativePath $css $js $links
	}
}

function ProcessHtml() {

	param (
		[string]$buildDir,
		[string]$file,
		[string]$css,
		[string]$js,
		[string]$links
	)

	$publishFile = "$buildDir\$file"

	$html = Get-Content "$file" -Raw -Encoding "utf8"
	$html = $html.Replace('<div class="links" data-include-html="/_components/links.html"></div>', "<div class=""links"">$links`t`t`t`t`t</div>")
	$html = $html.Replace('href="/_assets/img', 'href="/meteo/img')
	$html = $html.Replace('<link rel="stylesheet" href="/_assets/css/styles.css">', "<style>$css`t</style>")
	$html = $html.Replace("<script src=""/_assets/js/main.js"" defer></script>", "<script>$js`t</script>")
	$html = $html.Replace("<script src=""/_assets/js/include.js"" defer></script>`r`n`t", "") # removing this block
	#$html = $html.Replace('"/_components', '"https://raw.githubusercontent.com/jurakovic/meteo/main/src/_components')
	$html = $html.Replace('<!--<img src="https://bit', '<img src="https://bit')
	$html = $html.Replace('right" />-->', 'right" />')

	mkdir -Force "$(Split-Path -Path $publishFile)" | Out-Null
	Write-Output $html | Set-Content -NoNewline -Path "$publishFile" -Encoding "utf8"
}

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
