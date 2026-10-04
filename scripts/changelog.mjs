// CHANGELOG.hr.md, the Croatian translation of CHANGELOG.md, to the HTML the
// changelog dialog is built from. Both files are one fixed shape of Markdown:
// an optional intro, then days, each a ## date heading (with the pull request
// in brackets when there was one) and its entries as a - list right under it.
// Any other line throws, naming it, as the manual's converter does.

import { escapeText } from './manual.mjs';

// the pull request is read past and left out: it is for whoever reads the
// file in the repository
const DAY = /^## (\d{4}-\d{2}-\d{2})(?: \(#\d+\))?$/;

// the glyphs of the buttons an entry names ([D], [+], [HR]), set as the
// manual sets them
function entry(text) {
	return escapeText(text).replace(/\[[^\]]{1,3}\]/g, '<code>$&</code>');
}

export function convertChangelog(text) {
	const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
	const html = [];
	let open = false; // a day's list, still taking its entries
	let dated = false; // past the first date, where the intro ends

	const close = () => {
		if (open) html.push('</ul>');
		open = false;
	};

	lines.forEach((line, i) => {
		if (line.trim() === '') {
			close();
			return;
		}
		const day = line.match(DAY);
		if (day) {
			close();
			html.push(`<h2>${day[1]}</h2>`, '<ul>');
			open = dated = true;
			return;
		}
		// the intro, a line to a paragraph, said once above every day; a > is
		// the quote GitHub sets it in, as the manual's, and not part of the text
		if (!dated && /^[^\s#-]/.test(line)) {
			html.push(`<p class="changelog-intro">${escapeText(line.replace(/^> /, '').trim())}</p>`);
			return;
		}
		// a blank line ends a day's list, so an entry after one has no date
		const item = line.match(/^- (\S.*)$/);
		if (item && open) {
			html.push(`<li>${entry(item[1].trimEnd())}</li>`);
			return;
		}
		throw new Error(`changelog: ${item ? 'entry without a date above it' : 'neither a date nor an entry'} (line ${i + 1}): ${line}`);
	});
	close();

	if (!dated) throw new Error('changelog: no entries found');
	// a date with nothing under it is a mistake as much as a stray line
	html.forEach((tag, i) => {
		if (tag === '<ul>' && html[i + 1] === '</ul>') throw new Error(`changelog: ${html[i - 1]} has no entries`);
	});
	return html;
}
