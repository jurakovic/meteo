// Arranging the board (A, Posloži): every widget the same size, tiled edge to
// edge. See INTERNALS.md, Arranging the board.

import { dlog } from '../lib/debug.js';
import { queryAll } from '../lib/dom.js';
import { viewportHeight, viewportWidth } from '../lib/geometry.js';
import { DESKTOP_MQ } from '../lib/media.js';
import { isDashboard } from './board.js';
import { isSnapped } from './columns.js';
import { ARRANGE_ASPECT, ARRANGE_HOLE, POPOUT_TITLE_HEIGHT } from './constants.js';
import { placePopout, shownImage } from './core.js';
import { updateGroups } from './groups.js';
import { arrangementChanged } from './layout.js';
import { syncShadows } from './overlap.js';
import { fitWidget, unlockAspect } from './popout.js';

// how many columns n widgets go in: the shape that shows each map biggest,
// an empty cell costing a hair
/** @param {number} n */
export function arrangeShape(n, width, height, aspect) {
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

// the shape of what a widget shows. A freed widget's rect is the cell an
// earlier arrangement cut, so it is not read, and a freed frame has no say
function mapAspect(block) {
	const img = shownImage(block);
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
/** @param {number} n */
export function shareOut(total, n) {
	const base = Math.floor(total / n);
	const extra = Math.round(total) - base * n;
	return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

export function runningTotal(sizes, upTo) {
	return sizes.slice(0, upTo).reduce((sum, size) => sum + size, 0);
}

// left to right and top to bottom in the order of the list, so the board reads
// the way the picker does. The last row carries the remainder and is not
// stretched to fill it: a wider tile there would be the one thing on the board
// unlike the others
export function arrangeBoard() {
	if (!isDashboard() || !DESKTOP_MQ.matches) return;
	// in the list's order, which is the DOM's; on a board every map is a widget
	const blocks = queryAll('.map-block.popout')
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
	arrangementChanged();
}
