// The changelog's format: what it renders, and what it refuses
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { convertChangelog } from '../../scripts/changelog.mjs';

test('days with and without a pull request, their entries escaped, button glyphs as code', () => {
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
		'<h2>2026-09-23 <a href="https://github.com/jurakovic/meteo/pull/42" target="_blank" rel="noopener">#42</a></h2>',
		'<ul>', '<li>added copies (<code>[D]</code>) &amp; seams.</li>', '<li>added the &lt;tab&gt;.</li>', '</ul>',
		'<h2>2026-08-20</h2>',
		'<ul>', '<li>updated sources.</li>', '</ul>'
	]);
});

test('lines outside the format throw, naming the line', () => {
	for (const [text, message] of [
		['2026-09-23\n  spaces, not a tab', /neither a date nor an entry \(line 2\)/],
		['\tan entry first', /entry without a date above it \(line 1\)/],
		['2026-09-23\n\ta\n\n\tafter a gap', /entry without a date above it \(line 4\)/],
		['23.09.2026.\n\ta', /neither a date nor an entry \(line 1\)/],
		['2026-09-23 #42\n\ta', /neither a date nor an entry/],
		['2026-09-23\n\n2026-09-22\n\ta', /<h2>2026-09-23<\/h2> has no entries/],
		['\n\n', /no entries found/]
	]) {
		assert.throws(() => convertChangelog(text), message, text);
	}
});

test('CHANGELOG.md itself converts', async () => {
	const text = await readFile(new URL('../../CHANGELOG.md', import.meta.url), 'utf8');
	assert.ok(convertChangelog(text).length > 0);
});
