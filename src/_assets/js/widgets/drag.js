// Dragging a widget or a group: the magnets, the snap to a column, the grid.
//
// the widget follows the pointer by the point of the title bar it was grabbed
// at. Once its edge reaches a viewport edge (wherever it is held — the place
// the pointer asks for is checked, not the clamped one, so pushing on past
// the edge still counts) it has a snap slot, previewed and taken on release.
// A snapped pane moves up and down its column until the drag is decidedly
// sideways, then floats again as it stood, the title bar kept under the
// pointer. Away from the viewport edges the other floating widgets are
// magnets: an edge brought close to one of theirs is pulled onto it. A
// grouped widget takes its group along: the members move by one offset, and
// the magnets, the viewport and the column snap see the group's bounding
// box in place of the widget held

import { clamp } from '../lib/geometry.js';
import { movePanes, showSnapPreview, snapColumnOf, snapPanes, snapSideAt, snapSlot, unsnapPane } from './columns.js';
import { MAGNET, POPOUT_TITLE_HEIGHT, SNAP_ARM, SNAP_DETACH } from './constants.js';
import { floatingBlocks } from './core.js';
import { snapToGrid } from './grid.js';
import { groupBox, groupMembers, groupStarts, moveGroup } from './groups.js';
import { arrangementChanged } from './layout.js';
import { trackWidgetPointer } from './overlap.js';

export function dragPopout(block, e) {
	let rect = block.getBoundingClientRect();
	const grab = { x: e.clientX - rect.left, y: e.clientY - rect.top };
	const members = groupMembers(block); // the widget alone when not grouped
	let starts = groupStarts(members), box = groupBox(starts);
	let col = snapColumnOf(block); // a group's members share it
	const magnets = magnetRects(block, members); // the others stay put for the drag
	let target = null;
	trackWidgetPointer(e, (dx, dy, ev) => {
		// a click on a parked widget must not move, snap or be pulled anywhere
		const armed = Math.hypot(dx, dy) >= SNAP_ARM;
		if (col) {
			if (Math.abs(dx) < SNAP_DETACH) {
				if (armed) movePanes(col, starts, box, dy);
				return;
			}
			// out of the column: the members float where they stand, measured
			// afresh, the title bar kept under the pointer
			members.forEach(unsnapPane);
			col = null;
			rect = block.getBoundingClientRect();
			grab.x = Math.min(grab.x, block.offsetWidth - POPOUT_TITLE_HEIGHT);
			grab.y = clamp(ev.clientY - rect.top, 0, POPOUT_TITLE_HEIGHT);
			starts = groupStarts(members);
			box = groupBox(starts);
		}
		// where the box is asked to go, off the widget held
		let boxLeft = box.left + ev.clientX - grab.x - rect.left, boxTop = box.top + ev.clientY - grab.y - rect.top;
		const side = armed ? snapSideAt(boxLeft, boxLeft + box.width) : null;
		target = side ? { side, slot: snapSlot(members, side, boxTop) } : null;
		if (armed && !target) ({ left: boxLeft, top: boxTop } = magnetPosition(magnets, boxLeft, boxTop, box.width, box.height));
		moveGroup(starts, box, boxLeft - box.left, boxTop - box.top);
		showSnapPreview(target ? target.slot : null);
	}, () => {
		showSnapPreview(null);
		if (target) { snapPanes(byPlace(members), target.side, target.slot); return; }
		snapToGrid(members); // on release, not during: the drag itself stays free
		arrangementChanged();
	});
}

// top to bottom, then left to right: the order a stack is made in
function byPlace(blocks) {
	return [...blocks].sort((a, b) => {
		const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
		return ra.top - rb.top || ra.left - rb.left;
	});
}

// the widgets floating over the page other than this one and the others
// moving with it — a pane is out of reach in its column, and a widget hosting
// a fullscreen map is not to be seen
export function magnetRects(block, along = []) {
	return floatingBlocks()
		.filter(other => other !== block && !along.includes(other) && !other.classList.contains('fs-host'))
		.map(other => other.getBoundingClientRect());
}

// where a widget of this size asked to left/top is pulled to. An edge within
// MAGNET of another widget's opposite edge meets it — beside it when the two
// overlap in height, above or below it when they overlap in width — and once
// they meet on one axis the nearer of the like edges lines up on the other,
// so a widget dropped below another sits flush with its left or right side.
// The closest edge wins on each axis; nothing within reach leaves the widget
// where it was asked
export function magnetPosition(rects, left, top, width, height) {
	const right = left + width, bottom = top + height;
	// the candidate carrying the closest edge within reach, with its widget
	const pull = (value, candidates) => {
		const edge = magnetEdge(value, candidates.map(c => c[0]));
		return edge === null ? null : candidates.find(c => c[0] === edge);
	};
	const beside = rects.filter(r => top < r.bottom && bottom > r.top);
	const stacked = rects.filter(r => left < r.right && right > r.left);
	let x = pull(left, beside.flatMap(r => [[r.right, r], [r.left - width, r]]));
	let y = pull(top, stacked.flatMap(r => [[r.bottom, r], [r.top - height, r]]));
	if (x && !y) y = pull(top, [[x[1].top, x[1]], [x[1].bottom - height, x[1]]]);
	if (y && !x) x = pull(left, [[y[1].left, y[1]], [y[1].right - width, y[1]]]);
	return { left: x ? x[0] : left, top: y ? y[0] : top };
}

// the closest of the edges within MAGNET of value, null when none is
export function magnetEdge(value, edges) {
	let best = null;
	edges.forEach(edge => {
		if (Math.abs(edge - value) <= MAGNET && (best === null || Math.abs(edge - value) < Math.abs(best - value))) best = edge;
	});
	return best;
}
