// An interactive map's fullscreen when its widget is on the board or in a
// column: the room it fills, and the widget's place in the stacking order.
//
// The board's answer to the same question. A column gives a pane one axis to
// grow in — the strip is the width, the panes above and below are the ends —
// and the board gives a widget four sides: the map takes the whole viewport,
// and a side comes in only where another widget *walls it off*, that is where
// the widgets on that side together cover the rectangle from end to end of its
// other axis. A widget that does not reach across walls nothing off and is
// floated over; the widgets keep their z-index range above the fullscreen map,
// so one in a corner stays where it is, over the corner of a map of the whole
// board. A widget lying over the host is on no side of it and so is never a
// wall.
//
// The walls are looked for again once the sides have come in, since narrowing
// the rectangle is what lets a widget reach across it: a widget over the right
// half alone walls off nothing of the viewport, and walls off the top of a
// rectangle that is already the right half. It settles in a pass or two —
// every pass only narrows — and stops when nothing moves.

import { viewportHeight, viewportWidth } from '../lib/geometry.js';
import { DESKTOP_MQ } from '../lib/media.js';
import { catalogMap } from '../maps/catalog.js';
import { instMapId } from '../maps/render.js';
import { isDashboard } from './board.js';
import { layoutSnapColumns } from './columns.js';
import { POPOUT_FS_Z, POPOUT_MARGIN } from './constants.js';
import { floatingBlocks, raisePopout } from './core.js';
import { persistSnapLayout } from './layout.js';

function freeRectAround(rect, blockers, bounds) {
	// the spans, laid end to end, reach from one side of the rectangle to the
	// other. A gap no wider than POPOUT_MARGIN is no gap: it is the grid's cell,
	// so widgets stacked on the grid wall as the eye reads them, and it is the
	// slack a wall wants anyway — a widget a few pixels off one still shuts the
	// region behind it as far as the eye is concerned.
	const covers = (spans, from, to) => {
		let at = from;
		spans.sort((a, b) => a[0] - b[0]).forEach(([lo, hi]) => {
			if (lo <= at + POPOUT_MARGIN) at = Math.max(at, hi);
		});
		return at >= to - POPOUT_MARGIN;
	};
	// the nearest line to the host's left that the widgets beyond it cover from
	// `from` to `to`; the other three sides are this one under a mirror or a
	// transpose, so there is one of these and not four
	const leftWall = (host, walls, from, to, fallback) => {
		const beyond = walls.filter(b => b.right <= host.left + 1);
		const lines = [...new Set(beyond.map(b => b.right))].sort((a, b) => b - a); // nearest first
		for (const line of lines) {
			const across = beyond.filter(b => b.left < line - 0.5 && b.right >= line - 0.5);
			if (covers(across.map(b => [b.top, b.bottom]), from, to)) return line;
		}
		return fallback;
	};
	const mirror = (r) => ({ left: -r.right, right: -r.left, top: r.top, bottom: r.bottom });
	const flip = (r) => ({ left: r.top, right: r.bottom, top: r.left, bottom: r.right });
	const both = (r) => mirror(flip(r));
	const mirrored = blockers.map(mirror), flipped = blockers.map(flip), bothed = blockers.map(both);
	let out = { ...bounds };
	for (let pass = 0; pass < 4; pass++) {
		const next = {
			left: leftWall(rect, blockers, out.top, out.bottom, bounds.left),
			right: -leftWall(mirror(rect), mirrored, out.top, out.bottom, -bounds.right),
			top: leftWall(flip(rect), flipped, out.left, out.right, bounds.top),
			bottom: -leftWall(both(rect), bothed, out.left, out.right, -bounds.bottom)
		};
		if (next.left === out.left && next.right === out.right && next.top === out.top && next.bottom === out.bottom) break;
		out = next;
	}
	return out;
}

export function fitBoardFullscreen() {
	const props = ['--fs-left', '--fs-right', '--fs-top', '--fs-bottom'];
	const blocks = floatingBlocks();
	const board = isDashboard();
	blocks.forEach(block => {
		if (!board || !block.classList.contains('fs-host')) {
			props.forEach(p => block.style.removeProperty(p));
			return;
		}
		const width = viewportWidth(), height = viewportHeight();
		// the widget's box is still there to read under its own fullscreen: the
		// bar and the map have gone position: fixed, but every map with a [ ] is
		// an interactive one, and an interactive map's widget is always free
		// (isFreePopout) and so carries an inline height of its own
		const rect = block.getBoundingClientRect();
		const blockers = blocks
			.filter(b => b !== block && !b.classList.contains('fs-host'))
			.map(b => b.getBoundingClientRect());
		const free = freeRectAround(
			{ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
			blockers, { left: 0, top: 0, right: width, bottom: height });
		block.style.setProperty('--fs-left', `${Math.round(free.left)}px`);
		block.style.setProperty('--fs-right', `${Math.round(width - free.right)}px`);
		block.style.setProperty('--fs-top', `${Math.round(free.top)}px`);
		block.style.setProperty('--fs-bottom', `${Math.round(height - free.bottom)}px`);
	});
}

// only an interactive map has a fullscreen to be stored
export function hasFullscreen(inst) {
	const map = catalogMap(instMapId(inst));
	return !!map && map.type === 'iframe';
}

// a map put fullscreen as stored: through its own button, so page/iframe.js does
// everything a click does (the gate, the [R], the scroll lock, the event)
export function restoreFullscreen(block) {
	const btn = block.querySelector('.fs-btn');
	if (btn && !block.querySelector('.if1.fullscreen')) btn.click();
}

export function initWidgetFullscreen() {
	// a fullscreen map fills its container (CSS off --snap-l/--snap-r and the
	// pane's side class); page/iframe.js says when one is toggled, so the column can
	// hide its dividers under it — and, when the page's scroll lock takes the
	// scrollbar, the viewport the columns are laid out in has changed width
	document.addEventListener('map-fullscreen', () => {
		// only the bar and the map move to the fullscreen place; the widget's box
		// would stay behind, an empty frame over whatever it was floating on.
		// The widgets floating over the page stay in view over the fullscreen map:
		// the host goes under every other widget for as long as it hosts one (the
		// page's own fullscreen sits there through the CSS), then back on top
		document.querySelectorAll('.map-block.popout').forEach(block => {
			const hosting = !!block.querySelector('.if1.fullscreen');
			const wasHosting = block.classList.contains('fs-host');
			block.classList.toggle('fs-host', hosting);
			if (hosting) block.style.zIndex = POPOUT_FS_Z;
			else if (wasHosting) raisePopout(block);
		});
		fitBoardFullscreen(); // on the board there is no column to fit it, and no page either
		layoutSnapColumns();
		// a widget's fullscreen is part of the arrangement (the fullscreen flag on
		// its entry); on a phone there is no arrangement on screen to write
		if (DESKTOP_MQ.matches) persistSnapLayout();
	});
}
