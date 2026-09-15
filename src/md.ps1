
# Turns MANUAL.md into the HTML the Upute dialog is built from. Dot-sourced by
# build.ps1; the Markdown stays the one source and nothing is written back into
# src/, which would put build output in the source tree.
#
# A fixed subset — ## and ### with slug ids, paragraphs, - lists, tables,
# blockquotes, **bold**, *italic*, `code`, [text](#anchor) and <kbd> — and a
# throw on anything outside it. The manual is the only input this ever reads,
# so a line it does not recognise is a mistake to be seen at build time rather
# than a page that quietly renders wrong.

$script:MdKbdOpen = '&lt;kbd&gt;'
$script:MdKbdClose = '&lt;/kbd&gt;'

# GitHub's own shape, because the document links to its own headings
# (#nadzorna-ploča) and those anchors have to resolve on the site as well:
# lowercased, punctuation dropped, spaces to hyphens — and every letter kept
# whatever alphabet it comes from, which is what leaves the diacritics on
function Get-MdSlug {
	param([string]$Text)

	$slug = $Text.ToLowerInvariant()
	$slug = [regex]::Replace($slug, '[^\p{L}\p{Nd} -]', '')
	$slug = $slug.Trim() -replace '\s+', '-'
	return $slug
}

function ConvertTo-MdText {
	param([string]$Text)

	return $Text.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;')
}

# Inline markup, in the one order that works: code spans are lifted out before
# anything else runs, since the manual writes glyphs inside them ([R], ❮, ×)
# that the rest would otherwise reach into; bold before italic, or ** would be
# read as an empty emphasis.
function ConvertTo-MdInline {
	param([string]$Text)

	$sentinel = [string][char]1
	$codes = New-Object System.Collections.ArrayList

	$work = [regex]::Replace($Text, '`([^`]+)`', {
		param($m)
		[void]$codes.Add($m.Groups[1].Value)
		return "$sentinel$($codes.Count - 1)$sentinel"
	})

	$work = ConvertTo-MdText $work

	# the one tag allowed through, put back after the blanket escape above
	$work = $work.Replace($script:MdKbdOpen, '<kbd>').Replace($script:MdKbdClose, '</kbd>')

	if ($work -match '&lt;/?[a-zA-Z]') {
		throw "md.ps1: HTML tag other than <kbd> in: $Text"
	}

	$work = [regex]::Replace($work, '\*\*([^*]+)\*\*', '<strong>$1</strong>')
	$work = [regex]::Replace($work, '\*([^*]+)\*', '<em>$1</em>')
	$work = [regex]::Replace($work, '\[([^\]]+)\]\(([^)]+)\)', '<a href="$2">$1</a>')

	if ($work -match '\*') {
		throw "md.ps1: unpaired * in: $Text"
	}
	if ($work -match '\]\(') {
		throw "md.ps1: malformed link in: $Text"
	}

	for ($i = 0; $i -lt $codes.Count; $i++) {
		$code = ConvertTo-MdText $codes[$i]
		$work = $work.Replace("$sentinel$i$sentinel", "<code>$code</code>")
	}

	return $work
}

function ConvertTo-MdRow {
	param([string]$Line, [string]$Cell)

	$trimmed = $Line.Trim().Trim('|')
	$cells = $trimmed -split '\|'
	$html = ($cells | ForEach-Object { "<$Cell>$(ConvertTo-MdInline $_.Trim())</$Cell>" }) -join ''
	return "<tr>$html</tr>"
}

function Convert-Manual {
	param([string]$Path)

	$raw = Get-Content $Path -Raw -Encoding "utf8"
	$lines = $raw -split "`r?`n"

	$body = New-Object System.Collections.ArrayList
	$toc = New-Object System.Collections.ArrayList
	$i = 0

	while ($i -lt $lines.Count) {
		$line = $lines[$i]

		if ($line.Trim() -eq '') { $i++; continue }

		# what the subset does not cover, named one by one so the message says
		# which it was: an indented line (a code block, or a nested list), a
		# fence, another bullet or a numbered list, a rule, a deeper heading,
		# and a line opening with a tag
		if ($line -match '^\s+\S') { throw "md.ps1: indented line (line $($i + 1)): $line" }
		if ($line -match '^```') { throw "md.ps1: code fence (line $($i + 1))" }
		if ($line -match '^[*+] ') { throw "md.ps1: use - for a list (line $($i + 1)): $line" }
		if ($line -match '^[0-9]+\. ') { throw "md.ps1: numbered list (line $($i + 1)): $line" }
		if ($line -match '^(---|\*\*\*|___)\s*$') { throw "md.ps1: horizontal rule (line $($i + 1))" }
		if ($line -match '^#{4,} ') { throw "md.ps1: heading below ### (line $($i + 1)): $line" }
		if ($line -match '^<') { throw "md.ps1: HTML block (line $($i + 1)): $line" }

		# the document's own title. The dialog's head bar already carries it, so
		# it is read and dropped rather than rendered a second time
		if ($line -match '^# ') { $i++; continue }

		if ($line -match '^(##|###) +(.*)$') {
			$level = $matches[1].Length
			$text = $matches[2].Trim()
			$slug = Get-MdSlug $text
			[void]$body.Add("<h$level id=""$slug"">$(ConvertTo-MdInline $text)</h$level>")
			[void]$toc.Add("<li class=""toc-$level""><a href=""#$slug"">$(ConvertTo-MdText $text)</a></li>")
			$i++
			continue
		}

		if ($line -match '^\|') {
			if (($i + 1) -ge $lines.Count -or $lines[$i + 1] -notmatch '^\|[\s:\-|]+\|\s*$') {
				throw "md.ps1: table without a delimiter row (line $($i + 1))"
			}
			[void]$body.Add('<table>')
			[void]$body.Add('<thead>')
			[void]$body.Add((ConvertTo-MdRow -Line $line -Cell 'th'))
			[void]$body.Add('</thead>')
			[void]$body.Add('<tbody>')
			$i += 2
			while ($i -lt $lines.Count -and $lines[$i] -match '^\|') {
				[void]$body.Add((ConvertTo-MdRow -Line $lines[$i] -Cell 'td'))
				$i++
			}
			[void]$body.Add('</tbody>')
			[void]$body.Add('</table>')
			continue
		}

		if ($line -match '^- ') {
			[void]$body.Add('<ul>')
			while ($i -lt $lines.Count -and $lines[$i] -match '^- (.*)$') {
				[void]$body.Add("<li>$(ConvertTo-MdInline $matches[1].Trim())</li>")
				$i++
			}
			[void]$body.Add('</ul>')
			continue
		}

		if ($line -match '^> ') {
			$quote = New-Object System.Collections.ArrayList
			while ($i -lt $lines.Count -and $lines[$i] -match '^> (.*)$') {
				[void]$quote.Add($matches[1].Trim())
				$i++
			}
			[void]$body.Add("<blockquote><p>$(ConvertTo-MdInline ($quote -join ' '))</p></blockquote>")
			continue
		}

		# everything left is a paragraph, running to the next blank line
		$para = New-Object System.Collections.ArrayList
		while ($i -lt $lines.Count -and $lines[$i].Trim() -ne '' -and $lines[$i] -notmatch '^(#|-|\||>)') {
			[void]$para.Add($lines[$i].Trim())
			$i++
		}
		[void]$body.Add("<p>$(ConvertTo-MdInline ($para -join ' '))</p>")
	}

	if ($toc.Count -eq 0) { throw "md.ps1: no headings found in $Path" }

	$html = New-Object System.Collections.ArrayList
	[void]$html.Add('<nav class="manual-toc">')
	[void]$html.Add('<ul>')
	$toc | ForEach-Object { [void]$html.Add($_) }
	[void]$html.Add('</ul>')
	[void]$html.Add('</nav>')
	$body | ForEach-Object { [void]$html.Add($_) }

	# CRLF, because Prepend-Tabs splits on it: joined with LF the whole document
	# would be one line to it and reach the page with only its first line indented
	return ($html -join "`r`n")
}
