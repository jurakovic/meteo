// The snap columns (desktop, over the page).
//
// a widget dragged to the left or right edge of the viewport snaps into a
// column there: a strip of the viewport's height in which panes sit freely one
// above another, the page laid out in what is left between the columns (body
// padding, through --snap-l/--snap-r). A pane is still a pop-out widget — same
// block, same fixed positioning, nothing moves in the DOM — only its width is
// the column's and its place comes from layoutSnapColumns(): a column has a
// width and each pane a top (a free pane a height too), all fractions of the
// viewport so a window resize keeps the proportions. Up and down the column a
// pane moves as a widget does over the page, the column's ends and the other
// panes its magnets; pulled sideways it floats again. The column's inner edge is
// its resize handle (.snap-ui, above the panes); .snap-col paints the column's
// ground below them. A free (iframe) pane keeps its own height; a locked one
// takes the column's width whole and the height its aspect gives at it. Either
// resizes by its top and bottom edge, a pull on a locked one letting the aspect
// go, since at a width that is not the pane's to give that is the only way a
// height changes. A group is a stack, kept one under another by every layout
// (settleSnapStacks). A fullscreen map in a pane fills what the column leaves
// free around it (fitSnapFullscreen).
//
// The columns can take the whole width — two of them meeting, or one at full
// width — which hides the page (body.snap-full also drops its scrollbar). An
// edge dragged that close snaps shut; a double-click on an edge shuts it too, or
// opens it back to the widths from before. Two columns that meet share one seam
// handle that moves width between them.

import { dlog } from '../lib/debug.js';
import { el } from '../lib/dom.js';
import { clamp, viewportHeight, viewportWidth } from '../lib/geometry.js';
import { isDashboard, setDashboard } from './board.js';
import { POPOUT_MAX_WIDTH, POPOUT_MIN_HEIGHT, POPOUT_TITLE_HEIGHT, SNAP_EDGE, SNAP_MIN_WIDTH, SNAP_SHUT } from './constants.js';
import { magnetEdge } from './drag.js';
import { arrangementChanged } from './layout.js';
import { trackWidgetPointer } from './overlap.js';
import { fitWidget } from './popout.js';

const snapColumns = {
	left: { side: 'left', width: null, panes: [], node: null, ui: null },
	right: { side: 'right', width: null, panes: [], node: null, ui: null }
};

// a column by its side, 'left' or 'right': { side, width, panes, … }
export function snapColumn(side) {
	return snapColumns[side];
}

// a column's width, as a fraction of the viewport, as the layout restores it
export function setSnapColumnWidth(side, fraction) {
	snapColumns[side].width = fraction;
}

let snapPreview = null;

let snapPageWidths = null; // the column widths before the page was hidden, for the way back

export function isSnapped(block) {
	return block.classList.contains('snapped');
}

export function snapColumnOf(block) {
	return Object.values(snapColumns).find(col => col.panes.some(p => p.block === block)) || null;
}

export function snapPaneOf(block) {
	const col = snapColumnOf(block);
	return col ? col.panes.find(p => p.block === block) : null;
}

function otherSnapColumn(col) {
	return col.side === 'left' ? snapColumns.right : snapColumns.left;
}

function snapColumnWidth(col) {
	return col.panes.length ? col.width : 0;
}

export function snapColumnPx(col) {
	return Math.round(snapColumnWidth(col) * viewportWidth());
}

// the columns leave the page no width (a rounding hair short of it counts)
function isSnapPageHidden() {
	return snapColumnWidth(snapColumns.left) + snapColumnWidth(snapColumns.right) >= 0.999;
}

// the column something spanning left..right is at: the one whose viewport
// edge its own edge has reached, if any. The board has no columns — a column
// is a strip the page makes room for, and there is no page there — so on it
// nothing targets one and a widget dragged to the edge simply stays a widget
export function snapSideAt(left, right) {
	if (isDashboard()) return null;
	return left <= SNAP_EDGE ? 'left' : right >= viewportWidth() - SNAP_EDGE ? 'right' : null;
}

// the edges a pane's top or bottom is drawn to in its column: the column's
// ends and the other panes' tops and bottoms (every pane spans the column, so
// all of them are in reach), the blocks given left out
export function paneMagnetEdges(col, exclude = []) {
	const edges = [0, viewportHeight()];
	col.panes.forEach(p => {
		if (exclude.includes(p.block) || p.block.classList.contains('fs-host')) return;
		const rect = p.block.getBoundingClientRect();
		edges.push(rect.top, rect.bottom);
	});
	return edges;
}

// a top for something of this height in the column: pulled onto an edge by
// its top or its bottom, then held inside the viewport
function paneTop(col, top, height, exclude = []) {
	const edges = paneMagnetEdges(col, exclude);
	const pulled = magnetEdge(top, edges.concat(edges.map(edge => edge - height)));
	return clamp(pulled === null ? top : pulled, 0, Math.max(0, viewportHeight() - height));
}

// the slot blocks dropped at side would take, the top their box asks for:
// the column's width (a new column takes the box's own, held to what the
// other column leaves) and the height the blocks stack to at that width — a
// free one keeps its height, a locked one's follows the width
export function snapSlot(blocks, side, boxTop) {
	const col = snapColumns[side];
	const boxWidth = Math.max(...blocks.map(b => b.offsetWidth));
	const width = col.panes.length
		? snapColumnPx(col)
		: clamp(boxWidth, SNAP_MIN_WIDTH, viewportWidth() - snapColumnPx(otherSnapColumn(col)));
	const height = blocks.reduce((sum, b) =>
		sum + (b.classList.contains('free') ? b.offsetHeight : Math.round(b.offsetHeight * width / b.offsetWidth)), 0);
	return {
		left: side === 'left' ? 0 : viewportWidth() - width,
		top: Math.round(paneTop(col, boxTop, height, blocks)),
		width,
		height
	};
}

export function showSnapPreview(rect) {
	if (!snapPreview) {
		snapPreview = el('div', { class: 'snap-preview', hidden: true });
		document.body.appendChild(snapPreview);
	}
	snapPreview.hidden = !rect;
	if (!rect) return;
	Object.assign(snapPreview.style, {
		left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`
	});
}

// blocks dropped into the column at side, stacked from the slot's top in
// their order: the first where the slot says, each next under the one before
export function snapPanes(blocks, side, slot) {
	const col = snapColumns[side];
	if (!col.panes.length) col.width = slot.width / viewportWidth();
	let y = slot.top;
	blocks.forEach(block => {
		dlog(`snapPane: ${block.dataset.mapId} → ${side}`);
		unsnapPane(block);
		attachSnapPane(col, block, y / viewportHeight());
		layoutSnapColumns();
		y = block.getBoundingClientRect().bottom;
	});
	arrangementChanged();
}

// a popped-out block becomes a pane of the column with its top there (a free
// one bringing its height along, the one it has unless stored); the first
// one brings the column's ground and handle with it
export function attachSnapPane(col, block, top, height) {
	if (!col.node) {
		col.node = el('div', { class: `snap-col snap-${col.side}` });
		col.ui = el('div', { class: `snap-ui snap-${col.side}` }, [
			el('div', { class: 'snap-edge', 'data-side': col.side })
		]);
		document.body.append(col.node, col.ui);
	}
	const pane = { block, top };
	if (block.classList.contains('free')) pane.height = height || block.offsetHeight / viewportHeight();
	col.panes.push(pane);
	block.classList.add('snapped', `snapped-${col.side}`); // the side places the pane's fullscreen (CSS)
}

// the pane floats again as it stood in the column, size and place kept
export function unsnapPane(block) {
	const col = snapColumnOf(block);
	if (!col) return;
	dlog(`unsnapPane: ${block.dataset.mapId}`);
	col.panes = col.panes.filter(p => p.block !== block);
	block.classList.remove('snapped', `snapped-${col.side}`);
	if (!col.panes.length) dropSnapColumn(col);
	layoutSnapColumns();
	// not persisted here: the callers (a drag, a dock, a move between columns) end in a state of their own
}

function dropSnapColumn(col) {
	if (col.node) col.node.remove();
	if (col.ui) col.ui.remove();
	col.node = col.ui = col.width = null;
	col.panes = [];
}

// the panes are gone with the tbody they were part of, and the board with
// them (applySnapLayout sets it again from the layout)
export function resetSnapColumns() {
	Object.values(snapColumns).forEach(dropSnapColumn);
	snapPageWidths = null;
	setDashboard(false);
	layoutSnapColumns();
}

export function layoutSnapColumns() {
	// first: with the page hidden its scrollbar goes, which widens the viewport the columns are laid out in
	document.body.classList.toggle('snap-full', isSnapPageHidden());
	const root = document.documentElement.style;
	root.setProperty('--snap-l', `${snapColumnPx(snapColumns.left)}px`);
	root.setProperty('--snap-r', `${snapColumnPx(snapColumns.right)}px`);
	const seam = isSnapPageHidden() && snapColumns.left.panes.length && snapColumns.right.panes.length;
	Object.values(snapColumns).forEach(col => {
		layoutSnapColumn(col, seam);
		col.panes.forEach(p => fitWidget(p.block)); // the column's width is theirs
	});
}

// with two columns meeting, the left edge handle is the seam between them and
// the right one steps aside
function layoutSnapColumn(col, seam) {
	const width = snapColumnPx(col);
	if (!width) return;
	const x = col.side === 'left' ? 0 : viewportWidth() - width;
	[col.node, col.ui].forEach(node => {
		node.style.left = `${x}px`;
		node.style.width = `${width}px`;
	});
	const edge = col.ui.querySelector('.snap-edge');
	edge.hidden = seam && col.side === 'right';
	edge.classList.toggle('snap-seam', seam && col.side === 'left');
	edge.title = seam ? 'Širina stupaca · dvoklik vraća stranicu'
		: isSnapPageHidden() ? 'Širina stupca · dvoklik vraća stranicu'
		: 'Širina stupca · dvoklik sakriva stranicu';
	col.panes.forEach(pane => fitSnapPane(pane, x, width));
	settleSnapStacks(col);
	fitSnapFullscreen(col);
}

// a group in a column is a stack: the members sit one under another in the
// order of their tops, from where the first one stands, whatever the fit
// made of their heights (a locked pane's follows the column's width), and
// the stack is held inside the viewport by its bottom — else by its top —
// the tops the members carry following
function settleSnapStacks(col) {
	const stacks = new Map();
	col.panes.forEach(p => {
		if (!p.block._group) return;
		if (!stacks.has(p.block._group)) stacks.set(p.block._group, []);
		stacks.get(p.block._group).push(p);
	});
	stacks.forEach(panes => {
		panes.sort((a, b) => a.top - b.top);
		const height = panes.reduce((sum, p) => sum + p.block.offsetHeight, 0);
		let y = clamp(panes[0].block.getBoundingClientRect().top, 0, Math.max(0, viewportHeight() - height));
		panes.forEach(p => {
			p.block.style.top = `${Math.round(y)}px`;
			p.top = y / viewportHeight();
			y += p.block.offsetHeight;
		});
	});
}

// a fullscreen map in a pane fills what its column leaves free around the
// pane: from the bottom of the panes above it (their top over the pane's —
// one lying over it counts, since it stays on top) to the top of the panes
// below it, the column's ends where there are none, and at least a map's
// minimum height whatever lies over it — the CSS reads the span off
// --fs-top and --fs-bottom, the other panes' rects as laid out just now
function fitSnapFullscreen(col) {
	col.panes.forEach(pane => {
		const block = pane.block;
		if (!block.classList.contains('fs-host')) {
			block.style.removeProperty('--fs-top');
			block.style.removeProperty('--fs-bottom');
			return;
		}
		const rect = block.getBoundingClientRect();
		let top = 0, bottom = viewportHeight();
		col.panes.forEach(p => {
			if (p === pane || p.block.classList.contains('fs-host')) return;
			const other = p.block.getBoundingClientRect();
			if (other.top < rect.top) top = Math.max(top, other.bottom);
			else bottom = Math.min(bottom, other.top);
		});
		const min = POPOUT_TITLE_HEIGHT + POPOUT_MIN_HEIGHT;
		top = clamp(top, 0, viewportHeight() - min);
		bottom = Math.max(bottom, top + min);
		block.style.setProperty('--fs-top', `${Math.round(top)}px`);
		block.style.setProperty('--fs-bottom', `${Math.round(viewportHeight() - bottom)}px`);
	});
}

// a pane takes the column's width — a free one with the height it carries, a
// locked one with the height its aspect gives at that width, the map following
// the column however wide it is pulled. Its top is the one it carries, held
// inside the viewport
function fitSnapPane(pane, x, width) {
	const block = pane.block;
	block.style.width = `${width}px`;
	if (pane.height !== undefined) {
		block.style.height = `${Math.round(clamp(pane.height * viewportHeight(), POPOUT_MIN_HEIGHT, viewportHeight()))}px`;
	}
	block.style.left = `${Math.round(x + (width - block.offsetWidth) / 2)}px`;
	block.style.top = `${Math.round(clamp(pane.top * viewportHeight(), 0, Math.max(0, viewportHeight() - block.offsetHeight)))}px`;
}

// panes moved up or down their column by one offset from where they stood
// (starts, their box): the box is drawn to the column's magnets and held
// inside the viewport, and the tops the panes carry follow
export function movePanes(col, starts, box, dy) {
	const top = paneTop(col, box.top + dy, box.height, starts.map(s => s.block));
	dy = top - box.top;
	starts.forEach(s => { snapPaneOf(s.block).top = (s.top + dy) / viewportHeight(); });
	layoutSnapColumns();
}

// the inner edge: the column may take everything the other one leaves, and
// close to that it snaps shut, hiding the page (the widths from before are
// kept for the double-click back)
function resizeSnapColumn(col, e) {
	const start = snapColumnPx(col);
	const max = viewportWidth() - snapColumnPx(otherSnapColumn(col));
	const before = { left: snapColumnWidth(snapColumns.left), right: snapColumnWidth(snapColumns.right) };
	trackWidgetPointer(e, (dx) => {
		let px = clamp(col.side === 'left' ? start + dx : start - dx, SNAP_MIN_WIDTH, max);
		if (px >= max - SNAP_SHUT) px = max;
		const width = px / viewportWidth();
		// exactly what the other leaves: the fractions have to sum to one for the hidden state to read
		col.width = px === max ? 1 - snapColumnWidth(otherSnapColumn(col)) : width;
		if (isSnapPageHidden() && !snapPageWidths && before.left + before.right < 0.999) snapPageWidths = before;
		if (!isSnapPageHidden()) snapPageWidths = null;
		layoutSnapColumns();
	}, arrangementChanged);
}

// the seam between two columns that meet moves width from one to the other
function resizeSnapSeam(e) {
	const { left, right } = snapColumns;
	const start = snapColumnPx(left);
	trackWidgetPointer(e, (dx) => {
		const px = clamp(start + dx, SNAP_MIN_WIDTH, viewportWidth() - SNAP_MIN_WIDTH);
		left.width = px / viewportWidth();
		right.width = 1 - left.width;
		layoutSnapColumns();
	}, arrangementChanged);
}

// double-click on an edge: hide the page behind the columns — this column
// takes what the other leaves — or bring it back, to the widths from before
// the page was hidden, else with a gap wide enough for the page's table
export function toggleSnapPage(col) {
	const other = otherSnapColumn(col);
	if (!isSnapPageHidden()) {
		snapPageWidths = { left: snapColumnWidth(snapColumns.left), right: snapColumnWidth(snapColumns.right) };
		col.width = 1 - snapColumnWidth(other);
	} else if (snapPageWidths && snapPageWidths.left + snapPageWidths.right < 0.999) {
		[snapColumns.left, snapColumns.right].forEach(c => { if (c.panes.length && snapPageWidths[c.side]) c.width = snapPageWidths[c.side]; });
		snapPageWidths = null;
	} else {
		const gap = Math.min(0.5, POPOUT_MAX_WIDTH / viewportWidth());
		[snapColumns.left, snapColumns.right].forEach(c => { if (c.panes.length) c.width *= 1 - gap; });
		snapPageWidths = null;
	}
	layoutSnapColumns();
	arrangementChanged();
}

export function snapHandlePointerDown(handle, e) {
	if (handle.classList.contains('snap-seam')) resizeSnapSeam(e);
	else resizeSnapColumn(snapColumns[handle.dataset.side], e);
}
