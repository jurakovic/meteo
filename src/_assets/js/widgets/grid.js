// The grid (desktop, on the board).
//
// Graph paper under the widgets, and the lines a widget settles onto when let
// go. The cell is a size, not a count: the lines are its multiples, so they are
// whole pixels by construction whatever the window, the cells stay square on
// every screen, and the paper is one repeating gradient however fine it gets.
// Two edges land on the same line whenever they lie within half a cell of each
// other, so at 16 the grid forgives 8px — many times the fraction of a pixel an
// aspect-derived height leaves between two widgets, which is what makes a
// snapped board exact where a placed one is only nearly so. Both switches are the
// browser's, not the view's (mapGrid, like msTab and msPanel): they are a way
// of working, so they do not travel in a preset or a link, and they keep their
// state while the board is off, when they do nothing

import { dlog } from '../lib/debug.js';
import { emit, EVENTS } from '../lib/events.js';
import { viewportHeight, viewportWidth } from '../lib/geometry.js';
import { DESKTOP_MQ } from '../lib/media.js';
import { readJson, STORAGE_KEYS, writeJson } from '../lib/storage.js';
import { isDashboard } from './board.js';
import { GRID_CELL, POPOUT_MIN_HEIGHT, POPOUT_MIN_WIDTH } from './constants.js';
import { placePopout } from './core.js';
import { fitWidget, syncBackdrop, unlockAspect } from './popout.js';

function loadGridPrefs() {
	const stored = readJson(STORAGE_KEYS.grid);
	if (!stored || typeof stored !== 'object') return { show: false, snap: false };
	return { show: stored.show === true, snap: stored.snap === true };
}

let { show: gridShow, snap: gridSnap } = loadGridPrefs();

export function isGridShown() {
	return gridShow;
}

export function isGridSnapped() {
	return gridSnap;
}

export function setGridPrefs(show, snap) {
	dlog(`setGridPrefs: show=${show} snap=${snap}`);
	gridShow = show;
	gridSnap = snap;
	writeJson(STORAGE_KEYS.grid, { show, snap });
	renderGrid();
	// the switches are in three places — the dialog's ticks, the tab's [G]/[S],
	// and the keys — so the ones that were not used are told
	emit(EVENTS.gridChanged);
}

// the paper itself: one fixed layer under the widgets and over the columns'
// ground, drawn by the CSS from the cell. The page's own far edge is no
// multiple of the cell and is not drawn — it is the edge of the screen
export function renderGrid() {
	const on = gridShow && isDashboard() && DESKTOP_MQ.matches;
	let grid = document.querySelector('.po-grid');
	if (!on) {
		if (grid) grid.remove();
		return;
	}
	if (!grid) {
		grid = document.createElement('div');
		grid.className = 'po-grid';
		// outside .container, which the board hides, and before the widgets in
		// the stacking order by its z-index rather than by where it sits
		document.body.appendChild(grid);
	}
	grid.style.setProperty('--grid-cell', `${GRID_CELL}px`);
}

// every multiple of the cell across the extent, and the far edge itself: the
// page's edges are lines too, and the last multiple rarely lands on one
function gridLines(extent) {
	const lines = [];
	for (let at = 0; at < extent; at += GRID_CELL) lines.push(at);
	if (lines[lines.length - 1] !== extent) lines.push(extent);
	return lines;
}

function nearestLine(lines, value) {
	let best = 0;
	for (let i = 1; i < lines.length; i++) {
		if (Math.abs(lines[i] - value) < Math.abs(lines[best] - value)) best = i;
	}
	return best;
}

// each of the four edges to its nearest line, so the widget grows or shrinks
// to fit rather than being moved as it is. The aspect is freed first: a locked
// widget's height follows its width and could never reach a line of its own,
// and at this cell the letterbox that leaves is a few pixels at most. Held to
// the widget's minimum by taking the next line out, and to at least one cell
function snapBlockToGrid(block) {
	const xs = gridLines(viewportWidth()), ys = gridLines(viewportHeight());
	const rect = block.getBoundingClientRect();
	let left = nearestLine(xs, rect.left), right = nearestLine(xs, rect.right);
	let top = nearestLine(ys, rect.top), bottom = nearestLine(ys, rect.bottom);
	if (right <= left) right = Math.min(left + 1, xs.length - 1);
	if (bottom <= top) bottom = Math.min(top + 1, ys.length - 1);
	while (xs[right] - xs[left] < POPOUT_MIN_WIDTH && (right < xs.length - 1 || left > 0)) {
		if (right < xs.length - 1) right++;
		else left--;
	}
	while (ys[bottom] - ys[top] < POPOUT_MIN_HEIGHT && (bottom < ys.length - 1 || top > 0)) {
		if (bottom < ys.length - 1) bottom++;
		else top--;
	}
	if (!block.classList.contains('free')) unlockAspect(block);
	block.style.width = `${xs[right] - xs[left]}px`;
	block.style.height = `${ys[bottom] - ys[top]}px`;
	placePopout(block, xs[left], ys[top]);
	syncBackdrop(block);
	fitWidget(block);
}

// on release only, never while the gesture runs: the widget follows the
// pointer and settles onto the grid when it is let go
export function snapToGrid(blocks) {
	if (!gridSnap || !isDashboard() || !DESKTOP_MQ.matches) return;
	blocks.forEach(block => {
		if (!block.classList.contains('fs-host')) snapBlockToGrid(block);
	});
}

// the grid is the board's: off it the dialog's own switches are greyed and
// unclickable, the tab's are not shown at all, and the keys are as quiet — a
// switch flipped where nothing shows it is a switch lost
export function toggleGridShown() {
	if (!isDashboard()) return;
	setGridPrefs(!isGridShown(), isGridSnapped());
}

export function toggleGridSnapped() {
	if (!isDashboard()) return;
	setGridPrefs(isGridShown(), !isGridSnapped());
}
