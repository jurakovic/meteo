// The arrangement — what is popped out, where, in which column, grouped with
// what, and whether the view is a board — as data: read off the screen,
// checked on the way in from storage or a link, applied after a render, and
// written back after every gesture.

import { emit, EVENTS } from '../lib/events.js';
import { clamp, roundFraction, viewportHeight, viewportWidth } from '../lib/geometry.js';
import { DESKTOP_MQ } from '../lib/media.js';
import { getActiveMapPrefs, resolveMapIds, storeViewLayout } from '../maps/prefs.js';
import { instKey, instMapId } from '../maps/render.js';
import { arrangeBoard } from './arrange.js';
import { isDashboard, popoutRest, setDashboard } from './board.js';
import { attachSnapPane, layoutSnapColumns, resetSnapColumns, setSnapColumnWidth, snapColumn } from './columns.js';
import { POPOUT_MIN_HEIGHT, POPOUT_MIN_WIDTH, SNAP_MIN_WIDTH } from './constants.js';
import { instanceFor, isDuplicate } from './copies.js';
import { floatingBlocks, placePopout, popoutMaxWidth, raisePopout } from './core.js';
import { hasFullscreen, restoreFullscreen } from './fullscreen.js';
import { newGroupId, updateGroups } from './groups.js';
import { refreshOverlap, syncShadows } from './overlap.js';
import { dockAllPopouts, popoutMap, unlockAspect } from './popout.js';

export function initLayoutBreakpoint() {
	// widgets are a desktop thing: shrinking below the breakpoint puts them back,
	// and widening brings back what was put away — the arrangement belongs to the
	// view, not to the window, so it waits out a narrow one rather than being
	// unmade by it
	DESKTOP_MQ.addEventListener('change', (e) => {
		if (e.matches) { applySnapLayout(unappliedSnapLayout); return; }
		// what the view stores rather than what is on screen: the viewport has
		// narrowed already, and the fractions read off the screen now would be of
		// the narrow width (B1). Every gesture writes the arrangement as it ends,
		// so the stored one is the one on screen
		unappliedSnapLayout = sanitizeSnapLayout(getActiveMapPrefs().layout, resolveMapIds());
		withPersistPaused(dockAllPopouts); // the stored arrangement is kept for a desktop window
	});
}

// the arrangement as data: per side the column width and the panes as map
// ids with their tops (and a free pane's height), every number a fraction of
// the viewport, so another window or screen gets the proportions. Null when
// nothing is snapped. It rides in mapPrefs next to the map list, in a saved
// preset next to its maps, and in the ?v= payload — always a subset of the
// map list it sits beside, which is what sanitizeSnapLayout() holds it to on
// the way back. A group is a number shared by its members' entries, counted
// in order of appearance across the columns and the floating widgets
// the key each showing is stored under. Which showing is which is only a
// matter of the moment — any can be closed and another take the page's place —
// so the keys are dealt afresh on every write: the page's own showing first,
// under the plain map id, which is the block the render gives back on load, and
// the rest #2, #3 on in the page's order. A layout thus never names a copy of a
// map without the map itself, whichever of its showings were left
function layoutKeys() {
	const keys = new Map(), counts = new Map();
	const blocks = [...document.querySelectorAll('.map-block')];
	[...blocks.filter(b => !isDuplicate(b)), ...blocks.filter(isDuplicate)].forEach(block => {
		const id = block.dataset.mapId;
		const index = (counts.get(id) || 0) + 1;
		counts.set(id, index);
		keys.set(block, instKey(id, index));
	});
	return keys;
}

function snapLayout() {
	const layout = {};
	const keys = layoutKeys();
	const groupNumbers = new Map();
	const groupNumber = (block) => {
		if (!block._group) return undefined;
		if (!groupNumbers.has(block._group)) groupNumbers.set(block._group, groupNumbers.size + 1);
		return groupNumbers.get(block._group);
	};
	['left', 'right'].map(snapColumn).forEach(col => {
		if (!col.panes.length) return;
		layout[col.side] = {
			width: roundFraction(col.width),
			panes: [...col.panes].sort((a, b) => a.top - b.top).map(p => {
				const entry = { id: keys.get(p.block), top: roundFraction(p.top) };
				if (p.height !== undefined) entry.height = roundFraction(p.height);
				const group = groupNumber(p.block);
				if (group) entry.group = group;
				if (p.block.classList.contains('fs-host')) entry.fullscreen = true;
				return entry;
			})
		};
	});
	// widgets floating over the page, bottom to top, so they stack the same
	// way again; a locked one has no height of its own to store
	const floating = floatingBlocks()
		.sort((a, b) => (Number(a.style.zIndex) || 0) - (Number(b.style.zIndex) || 0))
		.map(block => {
			const rect = block.getBoundingClientRect();
			const entry = {
				id: keys.get(block),
				left: roundFraction(rect.left / viewportWidth()),
				top: roundFraction(rect.top / viewportHeight()),
				width: roundFraction(rect.width / viewportWidth())
			};
			if (block.classList.contains('free')) entry.height = roundFraction(rect.height / viewportHeight());
			const group = groupNumber(block);
			if (group) entry.group = group;
			if (block.classList.contains('fs-host')) entry.fullscreen = true;
			return entry;
		});
	if (floating.length) layout.floating = floating;
	if (isDashboard()) layout.dashboard = true;
	return Object.keys(layout).length ? layout : null;
}

// rebuilt rather than trusted (storage, links, a saved entry): a pane must
// name a map in the list, once across both columns and the floating widgets,
// and carry a top (a layout from before panes were placed freely carries a
// height share instead: those are stacked from the top as they were); the
// two widths are held to the viewport. A map dropped from the list leaves
// the layout, and an emptied column with it. A group is its members' place
// as much as their number: fewer than two, or spread over two places, is no
// group.
//
// The keys go in the order they always have: layouts are compared as JSON
// (sameSnapLayout), and one saved by an earlier version must still compare
// equal to itself read back
export function sanitizeSnapLayout(layout, mapIds) {
	if (!layout || typeof layout !== 'object') return null;
	const clean = {};
	const seen = new Set(); // every showing once, across the columns and the floating widgets
	const board = layout.dashboard === true;
	// a board has no columns: its panes are dropped here and come back as
	// widgets, through popoutRest
	if (!board) {
		['left', 'right'].forEach(side => {
			const col = sanitizeColumn(layout[side], mapIds, seen);
			if (col) clean[side] = col;
		});
	}
	if (clean.left && clean.right && clean.left.width + clean.right.width > 1) {
		clean.right.width = roundFraction(1 - clean.left.width);
		if (clean.right.width <= 0) delete clean.right;
	}
	const floating = sanitizeFloating(layout.floating, mapIds, seen);
	if (floating.length) clean.floating = floating;
	dropLoneGroups([clean.left && clean.left.panes, clean.right && clean.right.panes, clean.floating].filter(Boolean));
	if (board) clean.dashboard = true; // a board with nothing placed yet is still a board
	return Object.keys(clean).length ? clean : null;
}

function isFraction(n) {
	return Number.isFinite(n) && n >= 0 && n <= 1;
}

// whether a stored entry names a showing of a map in the list, not yet placed
function isListedShowing(entry, mapIds, seen) {
	return !!entry && typeof entry.id === 'string' && mapIds.includes(instMapId(entry.id)) && !seen.has(entry.id);
}

// what a pane and a floating widget carry alike, after their place: a height
// of their own, a group number, and a fullscreen (an interactive map's only)
function sanitizeEntryTail(stored, entry) {
	const height = Number(stored.height);
	if (isFraction(height) && height > 0) entry.height = roundFraction(height);
	if (Number.isInteger(stored.group) && stored.group > 0) entry.group = stored.group;
	if (stored.fullscreen === true && hasFullscreen(stored.id)) entry.fullscreen = true;
	return entry;
}

// a column: its width within the viewport, and the panes naming listed maps;
// null for a column with none
function sanitizeColumn(col, mapIds, seen) {
	if (!col || typeof col !== 'object' || !Array.isArray(col.panes)) return null;
	const width = Number(col.width);
	if (!(width > 0 && width <= 1)) return null;
	const panes = [];
	let stacked = 0;
	col.panes.forEach(p => {
		if (!isListedShowing(p, mapIds, seen)) return;
		const entry = { id: p.id };
		const top = Number(p.top), share = Number(p.share);
		if (isFraction(top)) {
			entry.top = roundFraction(top);
		} else if (share > 0 && share <= 1) {
			entry.top = roundFraction(stacked);
			entry.height = roundFraction(share);
			stacked += share;
		} else {
			return;
		}
		seen.add(p.id);
		panes.push(sanitizeEntryTail(p, entry));
	});
	return panes.length ? { width: roundFraction(width), panes } : null;
}

// the floating widgets naming listed maps, each with a place and a width
function sanitizeFloating(list, mapIds, seen) {
	if (!Array.isArray(list)) return [];
	return list
		.filter(f => isListedShowing(f, mapIds, seen)
			&& isFraction(Number(f.left)) && isFraction(Number(f.top)) && isFraction(Number(f.width)) && Number(f.width) > 0)
		.map(f => {
			seen.add(f.id);
			const entry = { id: f.id, left: roundFraction(Number(f.left)), top: roundFraction(Number(f.top)), width: roundFraction(Number(f.width)) };
			return sanitizeEntryTail(f, entry);
		});
}

// a group of fewer than two, or spread over two places, is no group
function dropLoneGroups(lists) {
	const groups = new Map(); // group number → how many members, over how many places
	lists.forEach(list => list.forEach(entry => {
		if (!entry.group) return;
		if (!groups.has(entry.group)) groups.set(entry.group, { count: 0, places: new Set() });
		groups.get(entry.group).count++;
		groups.get(entry.group).places.add(list);
	}));
	lists.forEach(list => list.forEach(entry => {
		const group = groups.get(entry.group);
		if (group && (group.count < 2 || group.places.size > 1)) delete entry.group;
	}));
}

export function sameSnapLayout(a, b) {
	return JSON.stringify(a || null) === JSON.stringify(b || null);
}

// the columns from a (sanitized) layout, after a render: each pane is popped
// out and attached to its column as stored, then the widths are set as
// stored. Desktop only, like the gestures — on a phone the layout is carried,
// not shown
export function applySnapLayout(layout) {
	resetSnapColumns();
	// the mode before anything is measured: the page's scrollbar goes with it
	setDashboard(!!(layout && layout.dashboard && DESKTOP_MQ.matches));
	// nothing to place, but the sweep still has to run: the widgets this replaces
	// go with the tbody (renderMaps) rather than being docked, so their shadows
	// are left in the layer with no widget to own them, and the refreshOverlap
	// that sweeps them is below this return
	if (!layout || !DESKTOP_MQ.matches) {
		// a narrow window is not a change of mind: the arrangement it cannot
		// show is kept whole, to be written on the view's behalf and applied
		// once there is a desktop window again
		unappliedSnapLayout = DESKTOP_MQ.matches ? null : layout;
		syncShadows();
		return;
	}
	unappliedSnapLayout = null;
	// what is being applied is already what is stored
	const tiled = withPersistPaused(() => placeSnapLayout(layout));
	// the tiling was decided here rather than read from the layout, so it is
	// the one thing this function has to write back
	if (tiled) arrangementChanged();
}

// the widgets and panes a layout names, put in place; true when the board had
// nothing placed and was tiled instead
function placeSnapLayout(layout) {
	const toFullscreen = [];
	const groupIds = new Map(); // stored group number → a fresh id
	const setGroup = (block, group) => {
		if (!group) return;
		if (!groupIds.has(group)) groupIds.set(group, newGroupId());
		block._group = groupIds.get(group);
	};
	['left', 'right'].forEach(side => {
		const stored = layout[side];
		if (!stored) return;
		const col = snapColumn(side);
		stored.panes.forEach(({ id, top, height, group, fullscreen }) => {
			const block = instanceFor(id);
			if (!block || block.classList.contains('popout')) return;
			popoutMap(block);
			if (height && !block.classList.contains('free')) unlockAspect(block); // a locked map stored with a height was freed
			attachSnapPane(col, block, top, height);
			setGroup(block, group);
			if (fullscreen) toFullscreen.push(block);
		});
		if (!col.panes.length) return;
		setSnapColumnWidth(side, clamp(stored.width * viewportWidth(), SNAP_MIN_WIDTH, viewportWidth()) / viewportWidth());
	});
	const left = snapColumn('left'), right = snapColumn('right');
	if (left.panes.length && right.panes.length && left.width + right.width > 1) setSnapColumnWidth('right', 1 - left.width);
	layoutSnapColumns();
	(layout.floating || []).forEach(({ id, left, top, width, height, group, fullscreen }) => {
		const block = instanceFor(id);
		if (!block || block.classList.contains('popout')) return;
		popoutMap(block);
		if (height && !block.classList.contains('free')) unlockAspect(block);
		// the stored width as stored, held to the widget limits
		block.style.width = `${Math.round(clamp(width * viewportWidth(), POPOUT_MIN_WIDTH, popoutMaxWidth()))}px`;
		if (block.classList.contains('free') && height)
			block.style.height = `${Math.round(clamp(height * viewportHeight(), POPOUT_MIN_HEIGHT, viewportHeight()))}px`;
		placePopout(block, left * viewportWidth(), top * viewportHeight());
		raisePopout(block); // in stored order, so the last one is on top again
		setGroup(block, group);
		if (fullscreen) toFullscreen.push(block);
	});
	// a board the layout places nothing on is a new one, and a new board is
	// tiled rather than cascaded. Where it does place some, the rest cascade in
	// beside them: an arrangement already made is not taken apart to make room
	const tiled = isDashboard() && !(layout.floating || []).length;
	if (isDashboard()) popoutRest(); // the maps of the list the layout does not place: onto the board
	if (tiled) arrangeBoard();
	// once everything stands where it belongs: a pane's fullscreen is placed
	// by its column, and page/iframe.js reads off the pane whether to lock the page
	toFullscreen.forEach(restoreFullscreen);
	updateGroups();
	refreshOverlap(); // persistence is paused, so this is not reached through it
	return tiled;
}

export function applyStoredSnapLayout() {
	applySnapLayout(sanitizeSnapLayout(getActiveMapPrefs().layout, resolveMapIds()));
}

let snapPersistPaused = false;

// fn with the arrangement's writes held back, and whatever was in force
// before put back afterwards — also when fn throws, which would otherwise
// leave every later gesture unsaved for the rest of the session
export function withPersistPaused(fn) {
	const paused = snapPersistPaused;
	snapPersistPaused = true;
	try {
		return fn();
	} finally {
		snapPersistPaused = paused;
	}
}

// the arrangement the view holds but the window is too narrow to show. Below
// the breakpoint applySnapLayout() places nothing, so the board stands empty
// while the preferences still describe a desktop arrangement — and snapLayout(),
// which reads the screen, would describe that emptiness. Everything that writes
// the arrangement, or asks the dialog what the view holds, goes through
// currentSnapLayout() instead, so a narrow window never writes the empty board
// over what a desktop window put there. Cleared the moment it is applied
let unappliedSnapLayout = null;

// what is on screen, or — where none of it is placed — what is stored waiting
// for a desktop window
export function currentSnapLayout() {
	return unappliedSnapLayout || snapLayout();
}

// the mode the view holds, which below the breakpoint is the stored one: the
// board is not on screen there, but it is still what the view says, and the
// dialog's mode row would otherwise tick itself off and apply that
export function isDashboardView() {
	return unappliedSnapLayout ? unappliedSnapLayout.dashboard === true : isDashboard();
}

// the arrangement changed — a gesture ended, a widget came or went. Three
// things follow, always together: what touches what (the group buttons) and
// what lies over what (covered frames, the fullscreen's room, the shadows) are
// worked out again, and the arrangement is stored with the view
// (storeViewLayout) and announced (layout-changed) — unless held back
// (withPersistPaused): the breakpoint docking everything is the window
// changing, not the arrangement
export function arrangementChanged() {
	updateGroups();
	refreshOverlap();
	if (snapPersistPaused) return;
	storeViewLayout(currentSnapLayout());
	emit(EVENTS.layoutChanged);
}
