// Resizing a widget, a group or a seam.
//
// Widgets: resizing from any side or corner. Width is the dimension every widget has; a
// locked (aspect) widget derives its height from it, so a pull on its top or
// bottom edge is turned into the width that gives that height, and a corner
// follows whichever axis asks for more. Pulling the left or top edge keeps the
// opposite edge where it is by moving the widget along. The pulled edge is drawn
// by the other floating widgets too (magnets, as on drag): onto the facing edge
// of one beside it, or into line with the like edge of one above or below it —
// exact for a width, and through the aspect ratio for a locked widget's height,
// whose width then has a moving edge of its own to pull, so the widget lines up
// by that edge too. A free pane in a column keeps the column's width: its top or
// bottom edge is drawn to the column's ends and the other panes, and the top it
// carries follows. A grouped floating widget's handles resize the whole group
// (resizeGroup); a grouped pane resizes on its own in its stack, which keeps
// together — the members above it move up with its top edge, the ones below down
// with its bottom edge (the settle in layoutSnapColumn), and the stack's ends
// stop at the column's

import { dlog } from '../lib/debug.js';
import { clamp, viewportHeight, viewportWidth } from '../lib/geometry.js';
import { pulledSize } from '../lib/pointer.js';
import { isSnapped, layoutSnapColumns, paneMagnetEdges, snapColumnOf, snapPaneOf } from './columns.js';
import { POPOUT_MIN_HEIGHT, POPOUT_MIN_WIDTH, SEAM_ALIGN } from './constants.js';
import { floatingBlocks, placePopout, popoutMaxWidth } from './core.js';
import { magnetEdge, magnetRects } from './drag.js';
import { snapToGrid } from './grid.js';
import { groupBox, groupMembers, groupRelations, groupStarts, updateGroups } from './groups.js';
import { arrangementChanged } from './layout.js';
import { trackWidgetPointer } from './overlap.js';
import { fitWidget, lockAspect, unlockAspect } from './popout.js';

// Two widgets edge to edge with the shared edge running the whole of both
// sides: then it is a seam, and dragging it moves it — one side giving what
// the other takes, the pair keeping the room it had and everything around them
// left where it stands. It is what a tiled board is for, and it settles a press
// that was always ambiguous: the two widgets' handles lie on top of each other
// along that edge, so which of them was grabbed came down to which was raised
// last. Either one now means the same thing.
//
// A side handle only, never a corner: a corner belongs to two edges at once and
// to however many widgets meet there. And whole edges only — a seam between
// sides of unequal length cannot move without tearing one of them off the
// neighbours it meets further along.
export function seamNeighbour(block, dir) {
	if (dir.length !== 1 || isSnapped(block) || block.classList.contains('fs-host')) return null;
	const a = block.getBoundingClientRect();
	const near = (p, q) => Math.abs(p - q) <= SEAM_ALIGN;
	const found = floatingBlocks().filter(other => {
		if (other === block || other.classList.contains('fs-host')) return false;
		const b = other.getBoundingClientRect();
		if (dir === 'e' || dir === 'w') {
			const meets = dir === 'e' ? near(b.left, a.right) : near(b.right, a.left);
			return meets && near(b.top, a.top) && near(b.bottom, a.bottom);
		}
		const meets = dir === 's' ? near(b.top, a.bottom) : near(b.bottom, a.top);
		return meets && near(b.left, a.left) && near(b.right, a.right);
	});
	// two of them is no seam: the edge would be one widget's on one side and
	// two widgets' on the other, and there would be no saying which to move
	return found.length === 1 ? found[0] : null;
}

export function resizeSeam(block, other, dir, e) {
	dlog(`resizeSeam: ${block.dataset.mapId} | ${other.dataset.mapId} (${dir})`);
	const sideways = dir === 'e' || dir === 'w';
	// the two sizes have to move on their own here, and a locked widget's height
	// follows its width — the seam would come apart under the gesture that moves it
	unlockAspect(block);
	unlockAspect(other);
	const ra = block.getBoundingClientRect(), rb = other.getBoundingClientRect();
	// named by where they lie and not by which was grabbed, so the arithmetic
	// below is the same whichever of the two handles the press landed on
	const [first, second] = sideways
		? (ra.left <= rb.left ? [block, other] : [other, block])
		: (ra.top <= rb.top ? [block, other] : [other, block]);
	const rf = first.getBoundingClientRect(), rs = second.getBoundingClientRect();
	const firstSize = sideways ? rf.width : rf.height;
	const secondSize = sideways ? rs.width : rs.height;
	const secondAt = sideways ? rs.left : rs.top;
	const min = sideways ? POPOUT_MIN_WIDTH : POPOUT_MIN_HEIGHT;
	// the seam is pulled onto the like edges of the rest of the board, as a
	// single edge is: a seam lined up with the one in the row above is most of
	// what a tiled board asks of it
	const edges = magnetRects(first, [second]).flatMap(r => sideways ? [r.left, r.right] : [r.top, r.bottom]);
	trackWidgetPointer(e, (dx, dy) => {
		let move = sideways ? dx : dy;
		const pulled = magnetEdge(secondAt + move, edges);
		if (pulled !== null) move = pulled - secondAt;
		// held so neither side goes under its minimum, which is what keeps the
		// seam inside the pair rather than pushing it out the far end
		move = clamp(move, min - firstSize, secondSize - min);
		if (sideways) {
			first.style.width = `${Math.round(firstSize + move)}px`;
			second.style.width = `${Math.round(secondSize - move)}px`;
			second.style.left = `${Math.round(secondAt + move)}px`;
		} else {
			first.style.height = `${Math.round(firstSize + move)}px`;
			second.style.height = `${Math.round(secondSize - move)}px`;
			second.style.top = `${Math.round(secondAt + move)}px`;
		}
		// both, and fitWidget rather than fitTitles: a letterboxed widget holds
		// its arrows and indicators to the image's rect, which has just moved
		fitWidget(first);
		fitWidget(second);
	}, () => {
		// each edge to its nearest line, and the shared one is the same value
		// for both, so the two land on the same line and stay a seam
		snapToGrid([first, second]);
		updateGroups();
		arrangementChanged();
	});
}

// Shift holds the aspect and a plain pull is free of it, the way round an
// image editor has it. The key is read through the gesture rather than at the
// start of it: press or release it mid-pull and the rest of the pull answers,
// the widget taking its aspect back or letting it go where it stands, so what
// it is left as is what the key said when it was let go. The pointer need not
// move for this — trackWidgetPointer repeats the last move on the key itself.
// In a column the width is the column's, so the height is the only thing a
// pull can change and letting the aspect go is the only way to change it: a
// plain pull frees a locked pane, as it does over the page, and Shift holds
// the aspect and with it the pane. The double-click on the title bar is the
// way back to the aspect, there as anywhere.
export function resizePopout(block, dir, e) {
	const members = groupMembers(block);
	const col = snapColumnOf(block);
	if (col) resizePane(block, dir, e, col, members);
	else if (members.length > 1) resizeGroup(members, dir, e);
	else resizeFloating(block, dir, e);
}

// a pane's top or bottom edge, up or down its column: drawn to the column's
// ends and the other panes, the stack it belongs to moving along
function resizePane(block, dir, e, col, members) {
	const setMode = (shift) => {
		if (shift || block.classList.contains('free')) return;
		unlockAspect(block);
		snapPaneOf(block).height = block.offsetHeight / viewportHeight(); // a free pane carries its own
	};
	setMode(e.shiftKey);
	const start = block.getBoundingClientRect();
	const mates = groupStarts(members.filter(m => m !== block));
	const above = mates.filter(s => s.top < start.top), below = mates.filter(s => s.top > start.top);
	const stackTop = Math.min(start.top, ...above.map(s => s.top));
	const stackBottom = Math.max(start.bottom, ...below.map(s => s.bottom));
	trackWidgetPointer(e, (dx, dy, ev) => {
		setMode(ev.shiftKey); // the key as it is now, not as it was at the start
		if (!block.classList.contains('free')) return; // Shift is holding the aspect, so the column gives the height
		let { h } = pulledSize(dir, start, dx, dy);
		const edges = paneMagnetEdges(col, members); // the stack moves along, so it is no magnet
		if (dir.includes('s')) { const m = magnetEdge(start.top + h, edges); if (m !== null) h = m - start.top; }
		if (dir.includes('n')) { const m = magnetEdge(start.bottom - h, edges); if (m !== null) h = start.bottom - m; }
		h = clamp(h, POPOUT_MIN_HEIGHT, start.height + (dir.includes('n') ? stackTop : viewportHeight() - stackBottom));
		const pane = snapPaneOf(block);
		pane.height = h / viewportHeight();
		pane.top = (dir.includes('n') ? start.bottom - h : start.top) / viewportHeight();
		if (dir.includes('n')) above.forEach(s => { snapPaneOf(s.block).top = (s.top - (h - start.height)) / viewportHeight(); });
		layoutSnapColumns();
	}, () => { snapToGrid([block]); arrangementChanged(); });
}

// a widget over the page, from any side or corner
function resizeFloating(block, dir, e) {
	let ratio;
	const setMode = (shift) => {
		if (!shift && !block.classList.contains('free')) unlockAspect(block);
		else if (shift && block.classList.contains('letterbox')) {
			lockAspect(block);
			// the aspect it takes back is its content's, not the shape a free
			// pull left it in, so lockedWidthFor is re-seeded from what it now is
			const r = block.getBoundingClientRect();
			ratio = r.width / r.height;
		}
	};
	setMode(e.shiftKey);
	const start = block.getBoundingClientRect();
	ratio = start.width / start.height;
	// one ceiling for both axes, the map following the widget to any width it is
	// pulled to. What the pulled edge may reach is the room between the edge that
	// is not moving and the viewport edge it is pulled towards, and it is the
	// size that is held to that room rather than the widget put back inside the
	// viewport afterwards — which would move the edge that is not being dragged.
	// No margin is kept off the viewport edge here, so either axis can be filled
	// to it; placePopout keeps its own clamp. A widget always starts inside the
	// viewport (placePopout sees to it), so the room is never less than the side
	// it is the room for, and no gesture is forced to shrink one
	const room = {
		width: Math.min(popoutMaxWidth(), dir.includes('w') ? start.right : viewportWidth() - start.left),
		height: dir.includes('n') ? start.bottom : viewportHeight() - start.top
	};
	const magnets = magnetRects(block);
	trackWidgetPointer(e, (dx, dy, ev) => {
		setMode(ev.shiftKey); // the key as it is now, not as it was at the start
		const pulled = pulledSize(dir, start, dx, dy);
		let { w, h } = pullResizeEdges(magnets, dir, start, pulled.w, pulled.h);
		if (block.classList.contains('free')) {
			w = clamp(w, POPOUT_MIN_WIDTH, room.width);
			h = clamp(h, POPOUT_MIN_HEIGHT, room.height);
			block.style.height = `${Math.round(h)}px`;
		} else {
			w = lockedResizeWidth(block, dir, start, w, h, ratio, magnets, room);
		}
		block.style.width = `${Math.round(w)}px`;
		// the laid-out height, exact for locked widgets where it follows the
		// width — off the rect, like start, so the two can be subtracted without
		// offsetHeight's rounding costing the north edge a pixel
		h = block.getBoundingClientRect().height;
		placePopout(block, dir.includes('w') ? start.right - w : start.left, dir.includes('n') ? start.bottom - h : start.top);
		fitWidget(block);
	}, () => { snapToGrid([block]); arrangementChanged(); });
}

// the width a locked widget pulled to w by h takes: its height follows its
// width, so a pull on the top or bottom is the width that gives that height,
// and whichever edge moves is offered the magnets
function lockedResizeWidth(block, dir, start, w, h, ratio, magnets, room) {
	// the width the wanted height asks for, read off the widget rather
	// than taken from the start ratio, so the pulled edge lands on its
	// magnet and a plain drag follows the pointer (lockedWidthFor)
	if (dir === 'n' || dir === 's') w = lockedWidthFor(block, h, h * ratio, ratio, room.width);
	else if (dir.length === 2) w = Math.max(w, lockedWidthFor(block, h, h * ratio, ratio, room.width));
	// the width the height asked for moves the right edge (the left, pulled from the west)
	if (!(dir.includes('e') || dir.includes('w')) || dir.length === 2)
		w = pullResizeEdges(magnets, dir.includes('w') ? 'w' : 'e', start, w, h).w;
	w = clamp(w, POPOUT_MIN_WIDTH, room.width);
	// and the same the other way about: a width pulled by a side handle
	// carries the bottom edge down with it, since a locked height follows
	// the width, so that edge is offered the same magnets and the width
	// is taken back from the height that lands on one — which is how a
	// widget widened beside a taller one stops level with its bottom
	if (dir !== 'n' && dir !== 's') {
		const vert = (dir.includes('n') ? 'n' : 's') + (dir.includes('w') ? 'w' : '');
		const at = lockedHeightAt(block, w);
		const want = pullResizeEdges(magnets, vert, start, w, at).h; // the height only; the width has had its pull
		if (Math.abs(want - at) > 0.5) w = lockedWidthFor(block, want, w + (want - at) * ratio, ratio, room.width);
	}
	// and the room is a height, which locked is a width as well: the
	// widest the widget stands inside it, so the aspect cannot carry the
	// height off the bottom of the screen
	if (lockedHeightAt(block, w) > room.height + 0.5)
		w = lockedWidthFor(block, room.height, room.height * ratio, ratio, room.width);
	return w;
}

// the pulled edges of something that started as start (left/top/right/
// bottom) and is asked to be w by h, drawn by the magnets: onto the facing
// edge of a widget beside it (above or below it, for a top or bottom edge)
// or into line with the like edge of one above or below it (beside it, for a
// top or bottom edge)
function pullResizeEdges(magnets, dir, start, w, h) {
	const left = dir.includes('w') ? start.right - w : start.left;
	const top = dir.includes('n') ? start.bottom - h : start.top;
	const beside = magnets.filter(r => top < r.bottom && top + h > r.top);
	const stacked = magnets.filter(r => left < r.right && left + w > r.left);
	const edge = (value, meet, align) => { const m = magnetEdge(value, meet.concat(align)); return m === null ? value : m; };
	if (dir.includes('e')) w = edge(start.left + w, beside.map(r => r.left), stacked.map(r => r.right)) - start.left;
	if (dir.includes('w')) w = start.right - edge(start.right - w, beside.map(r => r.right), stacked.map(r => r.left));
	if (dir.includes('s')) h = edge(start.top + h, stacked.map(r => r.top), beside.map(r => r.bottom)) - start.top;
	if (dir.includes('n')) h = start.bottom - edge(start.bottom - h, stacked.map(r => r.bottom), beside.map(r => r.top));
	return { w, h };
}

// the width at which a locked widget stands exactly h high. Its height is its
// title bar and indicators, which keep their height whatever the width, plus
// the map, which scales with it — so height is not proportional to width, and
// a ratio only approximates the width a wanted height asks for: it is out by
// about the bar's share of the height, a dozen pixels, which is the whole of
// MAGNET. Setting the width and reading back the height it gave closes that,
// since the error left is the bar's share of the error — under a tenth — so
// the second pass lands on the pixel. Cheap enough per move: the height is read
// back once anyway
export function lockedWidthFor(block, h, w, ratio, maxWidth) {
	for (let i = 0; i < 3; i++) {
		w = clamp(w, POPOUT_MIN_WIDTH, maxWidth);
		const got = lockedHeightAt(block, w);
		if (Math.abs(got - h) < 0.5) break;
		w += (h - got) * ratio;
	}
	return clamp(w, POPOUT_MIN_WIDTH, maxWidth);
}

// the height a locked widget stands at that width. Off the rect, not
// offsetHeight: the width is a whole pixel and the height it gives is not, and
// a rounded reading would keep a pixel of the error
export function lockedHeightAt(block, w) {
	block.style.width = `${Math.round(w)}px`;
	return block.getBoundingClientRect().height;
}

// a group resizes as one thing: its box is pulled as a locked widget's is —
// one scale for the whole, from the pulled axis, a corner following whichever
// asks for more — from the edge or corner opposite the one pulled, the other
// widgets its magnets. Every member is scaled by it (a free one in height
// too; a locked one's height follows its width, with the title bar not
// scaling along), then placed at its scaled offset and settled onto the
// members it touched or lined up with before (groupRelations), so a stack
// stays a stack whatever the title bars do
function resizeGroup(members, dir, e) {
	const starts = groupStarts(members);
	starts.forEach(s => {
		s.width = s.right - s.left;
		s.height = s.bottom - s.top;
		s.free = s.block.classList.contains('free');
	});
	const box = groupBox(starts);
	box.right = box.left + box.width;
	box.bottom = box.top + box.height;
	const relations = groupRelations(starts);
	const order = [...starts].sort((a, b) => a.top - b.top || a.left - b.left);
	const magnets = magnetRects(members[0], members);
	// the anchor: the box grows from the edge or corner opposite the one pulled
	const ax = dir.includes('w') ? box.right : box.left;
	const ay = dir.includes('n') ? box.bottom : box.top;
	// no member under its minimum or over the widest a widget may be, and the box inside the viewport
	const minScale = Math.max(
		POPOUT_MIN_WIDTH / Math.min(...starts.map(s => s.width)),
		...starts.filter(s => s.free).map(s => POPOUT_MIN_HEIGHT / s.height));
	const maxScale = Math.min(
		// no member past the widest a widget may be
		popoutMaxWidth() / Math.max(...starts.map(s => s.width)),
		(dir.includes('w') ? box.right : viewportWidth() - box.left) / box.width,
		(dir.includes('n') ? box.bottom : viewportHeight() - box.top) / box.height);
	trackWidgetPointer(e, (dx, dy) => {
		const pulled = pulledSize(dir, box, dx, dy);
		const { w, h } = pullResizeEdges(magnets, dir, box, pulled.w, pulled.h);
		let scale = dir === 'n' || dir === 's' ? h / box.height
			: dir.length === 2 ? Math.max(w / box.width, h / box.height)
			: w / box.width;
		scale = clamp(scale, minScale, Math.max(minScale, maxScale));
		starts.forEach(s => {
			s.block.style.width = `${Math.round(s.width * scale)}px`;
			if (s.free) s.block.style.height = `${Math.round(s.height * scale)}px`;
		});
		const placed = [];
		order.forEach(s => {
			let left = ax + (s.left - ax) * scale, top = ay + (s.top - ay) * scale;
			const width = s.block.offsetWidth, height = s.block.offsetHeight;
			relations.filter(r => r.to === s && placed.includes(r.from)).forEach(r => {
				const a = r.from.block.getBoundingClientRect();
				if (r.kind === 'below') top = a.bottom;
				else if (r.kind === 'above') top = a.top - height;
				else if (r.kind === 'right') left = a.right;
				else if (r.kind === 'left') left = a.left - width;
				else if (r.kind === 'alignLeft') left = a.left;
				else if (r.kind === 'alignRight') left = a.right - width;
				else if (r.kind === 'alignTop') top = a.top;
				else if (r.kind === 'alignBottom') top = a.bottom - height;
			});
			s.block.style.left = `${Math.round(left)}px`;
			s.block.style.top = `${Math.round(top)}px`;
			placed.push(s);
		});
		// fitWidget, not fitTitles alone: a letterboxed member's arrows and
		// indicators are held to the image's rect (--lb-*, fitLetterbox), so left
		// unmeasured through the gesture they keep the width the image had before
		// it — the group shrinking under indicators that do not
		members.forEach(fitWidget);
	}, () => { snapToGrid(members); arrangementChanged(); });
}
