// The changelog's format: what it renders, and what it refuses
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { convertChangelog } from '../../scripts/changelog.mjs';

test('days with and without a pull request, which is left out, their entries escaped, button glyphs as code', () => {
	const html = convertChangelog([
		'',
		'2026-09-23 (#42)',
		'\tadded copies ([D]) & seams.',
		'\tadded the <tab>.',
		'',
		'2026-08-20',
		'\tupdated sources.'
	].join('\n'));
	assert.deepEqual(html, [
		'<h2>2026-09-23</h2>',
		'<ul>', '<li>added copies (<code>[D]</code>) &amp; seams.</li>', '<li>added the &lt;tab&gt;.</li>', '</ul>',
		'<h2>2026-08-20</h2>',
		'<ul>', '<li>updated sources.</li>', '</ul>'
	]);
});

test('lines above the first date are the intro, a paragraph each, escaped', () => {
	assert.deepEqual(convertChangelog('Made with AI & care.\n\n2026-08-20\n\tupdated sources.'), [
		'<p class="changelog-intro">Made with AI &amp; care.</p>',
		'<h2>2026-08-20</h2>', '<ul>', '<li>updated sources.</li>', '</ul>'
	]);
});

test('lines outside the format throw, naming the line', () => {
	for (const [text, message] of [
		['2026-09-23\n  spaces, not a tab', /neither a date nor an entry \(line 2\)/],
		['\tan entry first', /entry without a date above it \(line 1\)/],
		['2026-09-23\n\ta\n\n\tafter a gap', /entry without a date above it \(line 4\)/],
		['2026-09-24\n\tb\n\n23.09.2026.\n\ta', /neither a date nor an entry \(line 4\)/],
		['2026-09-24\n\tb\n\n2026-09-23 #42\n\ta', /neither a date nor an entry \(line 4\)/],
		['23.09.2026.\n\ta', /entry without a date above it \(line 2\)/],
		['2026-09-23\n\n2026-09-22\n\ta', /<h2>2026-09-23<\/h2> has no entries/],
		['\n\n', /no entries found/],
		['only an intro', /no entries found/]
	]) {
		assert.throws(() => convertChangelog(text), message, text);
	}
});

const changelog = (name) => readFile(new URL(`../../${name}`, import.meta.url), 'utf8');

// a day's line and how many entries it has
const days = (text) => convertChangelog(text).reduce((list, line) => {
	if (line.startsWith('<h2>')) list.push([line, 0]);
	else if (line.startsWith('<li>')) list[list.length - 1][1]++;
	return list;
}, []);

test('CHANGELOG.md and its translation both convert, day for day and entry for entry', async () => {
	const english = days(await changelog('CHANGELOG.md'));
	assert.ok(english.length > 0);
	assert.deepEqual(days(await changelog('CHANGELOG.hr.md')), english);
});
