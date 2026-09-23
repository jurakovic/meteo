// Arranging the board (A, Posloži).
//
// Every widget the same size, tiled edge to edge over the whole board. It is
// what a board left running for the room to glance at wants — none of the
// screen spent on gaps, and nothing to line up by hand — and it is what makes
// the seams useful: tiled with no gap, every inside edge is one.
//
// The widgets are freed on the way. "The same size" and "the shape its image
// has" cannot both hold: given one width, locked widgets come out at as many
// heights as there are maps and no row would line up. A freed widget
// letterboxes its map over a blurred copy of it, and the double-click on the
// bar is the way back to its own shape, one map at a time.

import { dlog } from '../lib/debug.js';
import { viewportHeight, viewportWidth } from '../lib/geometry.js';
import { DESKTOP_MQ } from '../lib/media.js';
import { isDashboard } from './board.js';
import { isSnapped } from './columns.js';
import { ARRANGE_ASPECT, ARRANGE_HOLE, POPOUT_TITLE_HEIGHT } from './constants.js';
import { placePopout } from './core.js';
import { updateGroups } from './groups.js';
import { persistSnapLayout } from './layout.js';
import { syncShadows } from './overlap.js';
import { fitWidget, unlockAspect } from './popout.js';

// how many columns n widgets go in: the shape that shows each map biggest. A
// map is contained in what its cell leaves under the title bar, so its size is
// the cell's area only when the cell has the map's shape, and too wide or too
// tall a cell is spent on ground. That is what the eye asks of a board — ten
// maps go 4x3 with two holes rather than 2x5 in strips too thin to read, or
// 5x2 when the maps are square enough to be bigger that way. An empty cell
// costs a hair, so a tidy 3x3 is not passed over for a 4x3 whose maps come
// out the same size. Falls out as 2x2 for four, 3x2 for six and 4x3 for
// twelve, and on a wide screen puts two side by side rather than one above
// the other
function arrangeShape(n, width, height, aspect) {
	let best = { cols: 1, rows: n, score: -Infinity };
	for (let cols = 1; cols <= n; cols++) {
		const rows = Math.ceil(n / cols);
		const w = width / cols, h = height / rows - POPOUT_TITLE_HEIGHT;
		if (h <= 0) continue;
		const mapWidth = Math.min(w, h * aspect);
		const score = mapWidth * (mapWidth / aspect) * (1 - (cols * rows - n) * ARRANGE_HOLE);
		if (score > best.score) best = { cols, rows, score };
	}
	return best;
}

// the shape of what a widget shows: the image's or the video's own, or, for a
// locked widget of anything else, what its map takes of it under the bar. A
// freed widget's rect is not measured — it is the cell a previous arrangement
// cut, and reading it back would hand the next one the same shape whatever the
// maps are. A freed frame has no shape of its own and fills any cell, so it
// has no say
function mapAspect(block) {
	const img = block.querySelector('.slide.active img') || block.querySelector('.placeholder img');
	if (img && img.naturalWidth && img.naturalHeight) return img.naturalWidth / img.naturalHeight;
	const video = block.querySelector('video');
	if (video && video.videoWidth && video.videoHeight) return video.videoWidth / video.videoHeight;
	if (block.classList.contains('free')) return 0;
	const r = block.getBoundingClientRect();
	const h = r.height - POPOUT_TITLE_HEIGHT;
	return h > 0 ? r.width / h : 0;
}

// the maps' shape, averaged, so the cells are cut to fit what goes in them
function arrangeAspect(blocks) {
	const ratios = blocks.map(mapAspect).filter(ratio => ratio > 0);
	return ratios.length ? ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length : ARRANGE_ASPECT;
}

// n whole numbers summing to total, the remainder over the first of them: a
// fraction left on any cell would leave a hairline between two tiles, and a
// hairline is the difference between an edge that is a seam and one that is not
function shareOut(total, n) {
	const base = Math.floor(total / n);
	const extra = Math.round(total) - base * n;
	return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

function runningTotal(sizes, upTo) {
	return sizes.slice(0, upTo).reduce((sum, size) => sum + size, 0);
}

// left to right and top to bottom in the order of the list, so the board reads
// the way the picker does. The last row carries the remainder and is not
// stretched to fill it: a wider tile there would be the one thing on the board
// unlike the others
export function arrangeBoard() {
	if (!isDashboard() || !DESKTOP_MQ.matches) return;
	// in the list's order, which is the DOM's; on a board every map is a widget
	const blocks = [...document.querySelectorAll('.map-block.popout')]
		.filter(block => !isSnapped(block) && !block.classList.contains('fs-host'));
	if (!blocks.length) return;
	dlog(`arrangeBoard: ${blocks.length} widgets`);
	const width = viewportWidth(), height = viewportHeight();
	const { cols, rows } = arrangeShape(blocks.length, width, height, arrangeAspect(blocks));
	const widths = shareOut(width, cols);
	const heights = shareOut(height, rows);
	blocks.forEach((block, i) => {
		unlockAspect(block);
		block.style.width = `${widths[i % cols]}px`;
		block.style.height = `${heights[Math.floor(i / cols)]}px`;
	});
	// placed after every size is set, so the reads below are one layout and not
	// one per widget, and each tile is placed against sizes that are already final
	blocks.forEach((block, i) => {
		placePopout(block, runningTotal(widths, i % cols), runningTotal(heights, Math.floor(i / cols)));
		fitWidget(block);
	});
	updateGroups();
	syncShadows();
	persistSnapLayout();
}
