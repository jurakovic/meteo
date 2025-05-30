
function Main {
	$srcDir = (Get-Location).Path
	$buildDir = "$(Split-Path (Get-Location).Path -Parent)\docs"

	# Clean build directory
	Remove-Item -Path "$buildDir" -Recurse -Force -ErrorAction SilentlyContinue

	New-Item -ItemType Directory -Path "$buildDir" -Force > $null

	# Copy images to build directory
	Copy-Item -Path "$srcDir\_assets\img\" -Destination "$buildDir\img\" -Recurse

	# Read and inline CSS
	$css = Get-Content "$srcDir\_assets\css\styles.min.css" -Raw -Encoding "utf8"
	$css = Prepend-Tabs -str $css -num 2

	# Read and inline JavaScript
	$mainjs = Get-Content "$srcDir\_assets\js\main.min.js" -Raw -Encoding "utf8"
	$mainjs = Prepend-Tabs -str $mainjs -num 2

	$seo = Get-Content "$srcDir\_components\seo.c.html" -Raw -Encoding "utf8"
	$seo = Prepend-Tabs -str $seo -num 1 -skip 0

	$gtag = Get-Content "$srcDir\_components\gtag.c.html" -Raw -Encoding "utf8"
	$gtag = Prepend-Tabs -str $gtag -num 1 -skip 0

	$links = Get-Content "$srcDir\_components\links.c.html" -Raw -Encoding "utf8"
	$links = Prepend-Tabs -str $links -num 6

	# Find all .html files excluding those in _components directories
	$files = Get-ChildItem -Path $directory -Recurse -Filter *.html | Where-Object { $_.FullName -notmatch "\\_components\\" }

	# Print each file path
	foreach ($file in $files) {
		$relativePath = $file.FullName.Substring($srcDir.Length).TrimStart('\')
		ProcessHtml $buildDir $relativePath $css $mainjs $seo $gtag $links
	}
}

function ProcessHtml() {

	param (
		[string]$buildDir,
		[string]$file,
		[string]$css,
		[string]$mainjs,
		[string]$seo,
		[string]$gtag,
		[string]$links
	)

	$publishFile = "$buildDir\$file"

	$html = Get-Content "$file" -Raw -Encoding "utf8"
	$html = $html.Replace('href="/_assets/img', 'href="/meteo/img')
	$html = $html.Replace('href="/extras/index.html', 'href="/meteo/extras/')
	$html = $html.Replace('href="/"', 'href="/meteo/"')
	$html = $html.Replace('<link rel="stylesheet" href="/_assets/css/styles.css">', "<style>`r`n$css`r`n`t</style>")
	$html = $html.Replace("<script src=""/_assets/js/main.js"" defer></script>", "<script>`r`n$mainjs`r`n`t</script>")
	$html = $html.Replace("<script src=""/_assets/js/include.js"" defer></script>", "")
	$html = $html.Replace('<!-- seo -->', $seo)
	$html = $html.Replace('<!-- gtag -->', $gtag)
	$html = $html.Replace('<div class="links" data-include-html="/_components/links.c.html"></div>', "<div class=""links"">$links`t`t`t`t`t</div>")
	$html = $html.Replace('<!-- cnt -->', '<img src="https://bit.ly/radari-counter" style="width:1px;height:1px;float:right" />')
	$html = $html.Replace('right" />-->', 'right" />')

	#remove comments
	$html = [regex]::Replace($html, '(?s)<!--.*?-->', '')

	#trim whitespace
	$html = $html -split "`r`n" | ForEach-Object { $_.TrimEnd() }
	$html = $html -join "`r`n"

	#remove consecutive empty lines
	$html = [regex]::Replace($html, "(`r`n){3,}", "`r`n`r`n")
	$html = [regex]::Replace($html, "</script>`r`n`r`n", "</script>`r`n") # after minified main.js

	mkdir -Force "$(Split-Path -Path $publishFile)" | Out-Null
	Write-Output $html | Set-Content -NoNewline -Path "$publishFile" -Encoding "utf8"
}

function Prepend-Tabs {
	param (
		[string]$str,
		[int]$num,
		[int]$skip = -1  # Default: do not skip any line
	)

	# Define the character to prepend (tab character)
	$char = "`t"

	# Create a string with the character repeated 'num' times
	$prefix = ($char * $num)

	# One tab less for 'skip' line (index)
	$prefix0 = ($char * ($num - 1))

	# Initialize an array to hold the processed lines
	$output = @()

	# Split the input string into lines and process each line
	$lines = $str -split "`r`n"
	for ($i = 0; $i -lt $lines.Length; $i++) {
		$line = $lines[$i]
		if ($line -ne "") {
			if ($i -eq $skip) {
				$output += "$prefix0$line"
			} else {
				$output += "$prefix$line"
			}
		} else {
			$output += $line
		}
	}

	# Join the array into a single string with newline separators and return
	return $output -join "`r`n"
}

Main
