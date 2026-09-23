// MANUAL.md to the HTML the manual dialog is built from. A fixed subset —
// ## and ### with slug ids, paragraphs, - lists, tables, blockquotes, **bold**,
// *italic*, `code`, [text](#anchor) and <kbd> — and a throw on anything
// outside it: the manual is the only input, so a line it does not recognise
// is a mistake to see at build time rather than a page that renders wrong.

const KBD_OPEN = '&lt;kbd&gt;';
const KBD_CLOSE = '&lt;/kbd&gt;';

// GitHub's shape, since the document links to its own headings and those
// anchors have to resolve on the site too: lowercased, punctuation dropped,
// spaces to hyphens, letters of every alphabet kept (the diacritics stay)
export function slug(text) {
	return text.toLowerCase().replace(/[^\p{L}\p{Nd} -]/gu, '').trim().replace(/\s+/g, '-');
}

export function escapeText(text) {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

// code spans are lifted out before anything else runs, since the manual
// writes glyphs inside them ([R], ❮, ×) the rest would otherwise reach into;
// bold before italic, or ** would read as an empty emphasis
export function inline(text) {
	const sentinel = '\u0001';
	const codes = [];
	let work = text.replace(/`([^`]+)`/g, (m, code) => {
		codes.push(code);
		return `${sentinel}${codes.length - 1}${sentinel}`;
	});
	work = escapeText(work);
	// the one tag allowed through, put back after the blanket escape above
	work = work.replaceAll(KBD_OPEN, '<kbd>').replaceAll(KBD_CLOSE, '</kbd>');
	if (/&lt;\/?[a-z]/i.test(work)) throw new Error(`manual: HTML tag other than <kbd> in: ${text}`);
	work = work
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
	if (work.includes('*')) throw new Error(`manual: unpaired * in: ${text}`);
	if (work.includes('](')) throw new Error(`manual: malformed link in: ${text}`);
	codes.forEach((code, i) => {
		work = work.replaceAll(`${sentinel}${i}${sentinel}`, `<code>${escapeText(code)}</code>`);
	});
	return work;
}

function tableRow(line, cell) {
	const cells = line.trim().replace(/^\|+|\|+$/g, '').split('|');
	return `<tr>${cells.map(c => `<${cell}>${inline(c.trim())}</${cell}>`).join('')}</tr>`;
}

// the lines a construct outside the subset opens with, each named so the
// error says which it was
const UNSUPPORTED = [
	[/^\s+\S/, 'indented line'],
	[/^```/, 'code fence'],
	[/^[*+] /, 'use - for a list'],
	[/^[0-9]+\. /, 'numbered list'],
	[/^(---|\*\*\*|___)\s*$/, 'horizontal rule'],
	[/^#{4,} /, 'heading below ###'],
	[/^</, 'HTML block']
];

export function convertManual(markdown) {
	const lines = markdown.replace(/^\uFEFF/, '').split(/\r?\n/);
	const body = [];
	const toc = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];
		if (line.trim() === '') { i++; continue; }

		for (const [pattern, what] of UNSUPPORTED) {
			if (pattern.test(line)) throw new Error(`manual: ${what} (line ${i + 1}): ${line}`);
		}

		// the document's own title: the dialog's head bar carries it already
		if (/^# /.test(line)) { i++; continue; }

		const heading = line.match(/^(##|###) +(.*)$/);
		if (heading) {
			const level = heading[1].length;
			const text = heading[2].trim();
			const id = slug(text);
			body.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
			toc.push(`<li class="toc-${level}"><a href="#${id}">${escapeText(text)}</a></li>`);
			i++;
			continue;
		}

		if (/^\|/.test(line)) {
			if (i + 1 >= lines.length || !/^\|[\s:\-|]+\|\s*$/.test(lines[i + 1])) {
				throw new Error(`manual: table without a delimiter row (line ${i + 1})`);
			}
			body.push('<table>', '<thead>', tableRow(line, 'th'), '</thead>', '<tbody>');
			i += 2;
			while (i < lines.length && /^\|/.test(lines[i])) body.push(tableRow(lines[i++], 'td'));
			body.push('</tbody>', '</table>');
			continue;
		}

		if (/^- /.test(line)) {
			body.push('<ul>');
			let item;
			while (i < lines.length && (item = lines[i].match(/^- (.*)$/))) {
				body.push(`<li>${inline(item[1].trim())}</li>`);
				i++;
			}
			body.push('</ul>');
			continue;
		}

		if (/^> /.test(line)) {
			const quote = [];
			let part;
			while (i < lines.length && (part = lines[i].match(/^> (.*)$/))) {
				quote.push(part[1].trim());
				i++;
			}
			body.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`);
			continue;
		}

		// everything left is a paragraph, running to the next blank line
		const para = [];
		while (i < lines.length && lines[i].trim() !== '' && !/^(#|-|\||>)/.test(lines[i])) {
			para.push(lines[i].trim());
			i++;
		}
		// a line that opens like a block (-5, #upute) but is none of them: the
		// paragraph does not take it either, and the loop would stand on it
		if (!para.length) throw new Error(`manual: line opens like a block but is none (line ${i + 1}): ${line}`);
		body.push(`<p>${inline(para.join(' '))}</p>`);
	}

	if (!toc.length) throw new Error('manual: no headings found');
	return ['<nav class="manual-toc">', '<ul>', ...toc, '</ul>', '</nav>', ...body];
}
