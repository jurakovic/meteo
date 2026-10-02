// The widgets' arithmetic: tiling, magnets, touching, the free room around a
// fullscreen map, and the arrangement checked on its way in
import './setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, roundFraction, subpixel } from '../../src/_assets/js/lib/geometry.js';
import { arrangeShape, runningTotal, shareOut } from '../../src/_assets/js/widgets/arrange.js';
import { magnetEdge, magnetPosition } from '../../src/_assets/js/widgets/drag.js';
import { freeRectAround } from '../../src/_assets/js/widgets/fullscreen.js';
import { groupBox, groupRelations, rectsTouch } from '../../src/_assets/js/widgets/groups.js';
import { sameSnapLayout, sanitizeSnapLayout } from '../../src/_assets/js/widgets/layout.js';

const rect = (left, top, right, bottom) => ({ left, top, right, bottom });

test('clamp holds the floor when the range is empty; fractions and subpixels round', () => {
	assert.equal(clamp(5, 0, 10), 5);
	assert.equal(clamp(-1, 0, 10), 0);
	assert.equal(clamp(20, 0, 10), 10);
	assert.equal(clamp(5, 8, 2), 8);
	assert.equal(roundFraction(1 / 3), 0.3333);
	assert.equal(subpixel(10.12345), 10.123);
});

test('tiling: the shape that shows each map biggest', () => {
	const shape = (n, w = 1400, h = 900, aspect = 4 / 3) => { const { cols, rows } = arrangeShape(n, w, h, aspect); return `${cols}x${rows}`; };
	assert.equal(shape(1), '1x1');
	assert.equal(shape(2), '2x1'); // side by side on a wide screen
	assert.equal(shape(4), '2x2');
	assert.equal(shape(6), '3x2');
	assert.equal(shape(12), '4x3');
	assert.equal(shape(2, 800, 1400), '1x2'); // one above the other on a tall one
});

test('tiling: whole pixels summing to the total, the remainder on the first', () => {
	assert.deepEqual(shareOut(1400, 3), [467, 467, 466]);
	assert.deepEqual(shareOut(900, 2), [450, 450]);
	assert.equal(shareOut(1385, 4).reduce((a, b) => a + b), 1385);
	assert.equal(runningTotal([10, 20, 30], 2), 30);
});

test('magnets: the closest edge within reach, beside or stacked, then lined up', () => {
	assert.equal(magnetEdge(100, [90, 110, 105]), 105);
	assert.equal(magnetEdge(100, [80, 130]), null);
	const other = rect(0, 0, 400, 300);
	// dropped 6px right of its right edge and 10px low: pulled flush and level
	assert.deepEqual(magnetPosition([other], 406, 10, 300, 200), { left: 400, top: 0 });
	// far from anything: where it was asked
	assert.deepEqual(magnetPosition([other], 700, 500, 300, 200), { left: 700, top: 500 });
});

test('touching: an edge on an edge, overlapping along it', () => {
	assert.ok(rectsTouch(rect(0, 0, 100, 100), rect(100, 50, 200, 150)));
	assert.ok(!rectsTouch(rect(0, 0, 100, 100), rect(100, 100, 200, 200))); // a corner only
	assert.ok(!rectsTouch(rect(0, 0, 100, 100), rect(103, 0, 200, 100)));
	assert.deepEqual(groupBox([rect(0, 0, 100, 100), rect(100, 50, 200, 150)]), { left: 0, top: 0, width: 200, height: 150 });
});

test('group relations: what lies on what, alignments before the touch', () => {
	const a = rect(0, 0, 100, 100), b = rect(0, 100, 100, 200);
	const kinds = groupRelations([a, b]).filter(r => r.from === a && r.to === b).map(r => r.kind);
	assert.deepEqual(kinds, ['alignLeft', 'alignRight', 'below']);
});

test('the free room around a fullscreen map: walls only where widgets reach across', () => {
	const bounds = rect(0, 0, 1000, 800);
	const host = rect(400, 300, 600, 500);
	// a column of widgets down the left side walls it off
	assert.deepEqual(freeRectAround(host, [rect(0, 0, 200, 800)], bounds), rect(200, 0, 1000, 800));
	// a small widget in a corner walls nothing off
	assert.deepEqual(freeRectAround(host, [rect(0, 0, 100, 100)], bounds), bounds);
});

test('an arrangement from storage or a link is rebuilt, not trusted', () => {
	const ids = ['windy', 'essl', 'estofex'];
	assert.equal(sanitizeSnapLayout(null, ids), null);
	assert.equal(sanitizeSnapLayout('junk', ids), null);
	const clean = sanitizeSnapLayout({
		left: { width: 0.3, panes: [{ id: 'windy', top: 0.1, height: 0.5, fullscreen: true, group: 1 }, { id: 'gone', top: 0.2 }, { id: 'essl', top: 2 }] },
		right: { width: 0.9, panes: [{ id: 'estofex', top: 0 }] },
		floating: [
			{ id: 'windy', left: 0.1, top: 0.1, width: 0.2 }, // already a pane
			{ id: 'essl', left: 0.5, top: 0.5, width: 0.2, height: 0.3, group: 1, fullscreen: true }
		]
	}, ids);
	assert.deepEqual(clean, {
		// the lone group member loses its group, and only an interactive map keeps a fullscreen
		left: { width: 0.3, panes: [{ id: 'windy', top: 0.1, height: 0.5, fullscreen: true }] },
		right: { width: 0.7, panes: [{ id: 'estofex', top: 0 }] }, // the two widths held to the viewport
		floating: [{ id: 'essl', left: 0.5, top: 0.5, width: 0.2, height: 0.3 }]
	});
});

test('a board has no columns, keeps copies of listed maps, and stays a board when empty', () => {
	const ids = ['windy', 'essl'];
	assert.deepEqual(sanitizeSnapLayout({ dashboard: true, left: { width: 0.5, panes: [{ id: 'windy', top: 0 }] } }, ids), { dashboard: true });
	const board = sanitizeSnapLayout({ dashboard: true, floating: [
		{ id: 'windy', left: 0, top: 0, width: 0.5 },
		{ id: 'windy#2', left: 0.5, top: 0, width: 0.5 },
		{ id: 'gone#2', left: 0, top: 0.5, width: 0.5 }
	] }, ids);
	assert.deepEqual(board.floating.map(f => f.id), ['windy', 'windy#2']);
});

test('an old layout stacks panes by their height share', () => {
	const clean = sanitizeSnapLayout({ left: { width: 0.4, panes: [{ id: 'windy', share: 0.5 }, { id: 'essl', share: 0.5 }] } }, ['windy', 'essl']);
	assert.deepEqual(clean.left.panes, [{ id: 'windy', top: 0, height: 0.5 }, { id: 'essl', top: 0.5, height: 0.5 }]);
	assert.ok(sameSnapLayout(clean, JSON.parse(JSON.stringify(clean))));
	assert.ok(sameSnapLayout(null, undefined));
});

test('an arrangement keeps its key order, which the comparisons read as JSON', () => {
	const stored = { left: { width: 0.3, panes: [{ id: 'windy', top: 0.1, height: 0.5, group: 1, fullscreen: true }, { id: 'essl', top: 0.6, group: 1 }] }, floating: [{ id: 'estofex', left: 0.5, top: 0.5, width: 0.2, height: 0.3 }], dashboard: false };
	const expected = '{"left":{"width":0.3,"panes":[{"id":"windy","top":0.1,"height":0.5,"group":1,"fullscreen":true},{"id":"essl","top":0.6,"group":1}]},"floating":[{"id":"estofex","left":0.5,"top":0.5,"width":0.2,"height":0.3}]}';
	assert.equal(JSON.stringify(sanitizeSnapLayout(stored, ['windy', 'essl', 'estofex'])), expected);
});
