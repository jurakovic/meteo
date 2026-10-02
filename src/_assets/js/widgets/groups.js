// Groups of widgets: touching widgets joined to drag and raise as one. See
// INTERNALS.md, Groups.

import { dlog } from '../lib/debug.js';
import { el, queryAll } from '../lib/dom.js';
import { subpixel, viewportHeight, viewportWidth } from '../lib/geometry.js';
import { snapColumnOf, snapPaneOf } from './columns.js';
import { GROUP_TOUCH } from './constants.js';
import { allPopouts, floatingBlocks } from './core.js';
import { arrangementChanged } from './layout.js';
import { fitWidget } from './popout.js';

let groupSeq = 0;

// the group each grouped widget is in, by id
const groupOfBlock = new WeakMap();

/** @param {HTMLElement} block */
export function groupOf(block) {
	return groupOfBlock.get(block) || null;
}

// null takes the widget out of its group
/** @param {HTMLElement} block */
export function setGroupOf(block, id) {
	if (id) groupOfBlock.set(block, id);
	else groupOfBlock.delete(block);
}

// a group's id, fresh for every group made
export function newGroupId() {
	return `g${++groupSeq}`;
}

/** @param {HTMLElement} block */
export function groupMembers(block) {
	const group = groupOf(block);
	return group ? allPopouts().filter(b => groupOf(b) === group) : [block];
}

// the widgets a block can touch: the others in its place
function placeMates(block) {
	const col = snapColumnOf(block);
	return (col ? col.panes.map(p => p.block) : floatingBlocks()).filter(other => other !== block);
}

export function buildGroupButton() {
	const btn = el('a', { class: 'grp-btn', hidden: '' });
	btn.addEventListener('click', () => toggleGroup(btn.closest('.map-block')));
	return btn;
}

function toggleGroup(block) {
	if (!block || !block.classList.contains('popout')) return;
	if (groupOf(block)) leaveGroup(block);
	else joinGroup(block);
	arrangementChanged();
}

export function rectsTouch(a, b) {
	const alongY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0;
	const alongX = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0;
	const near = (p, q) => Math.abs(p - q) <= GROUP_TOUCH;
	return (alongY && (near(a.right, b.left) || near(a.left, b.right)))
		|| (alongX && (near(a.bottom, b.top) || near(a.top, b.bottom)));
}

function touchingBlocks(block) {
	const rect = block.getBoundingClientRect();
	return placeMates(block).filter(other =>
		!other.classList.contains('fs-host') && rectsTouch(rect, other.getBoundingClientRect()));
}

function joinGroup(block) {
	dlog(`joinGroup: ${block.dataset.mapId}`);
	const touched = touchingBlocks(block);
	if (!touched.length) return;
	// one group out of the widget, what it touches and the groups those are in
	const ids = new Set(touched.map(b => groupOf(b)).filter(Boolean));
	const id = ids.values().next().value || newGroupId();
	allPopouts().forEach(b => { if (ids.has(groupOf(b))) setGroupOf(b, id); });
	touched.forEach(b => setGroupOf(b, id));
	setGroupOf(block, id);
	updateGroups();
}

// a member leaves; what is left with one member is no group. In a column a
// group is a stack, so a middle member leaving splits it in two, the members
// above it and the ones below, each a group of its own if two or more
/** @param {HTMLElement} block */
export function leaveGroup(block) {
	dlog(`leaveGroup: ${block.dataset.mapId}`);
	const id = groupOf(block);
	setGroupOf(block, null);
	const rest = allPopouts().filter(b => groupOf(b) === id);
	const col = snapColumnOf(block);
	const below = col ? rest.filter(b => snapPaneOf(b).top > snapPaneOf(block).top) : [];
	if (below.length && below.length < rest.length) {
		const split = newGroupId();
		below.forEach(b => setGroupOf(b, split));
	}
	[rest.filter(b => !below.includes(b)), below].forEach(part => {
		if (part.length < 2) part.forEach(b => setGroupOf(b, null));
	});
	updateGroups();
}

// the grouped mark and the button on every widget: [-] on a member, [+] on a
// widget touching another, nothing where there is nothing to do
export function updateGroups() {
	allPopouts().forEach(block => {
		const grouped = !!groupOf(block);
		block.classList.toggle('grouped', grouped);
		const can = grouped || touchingBlocks(block).length > 0;
		queryAll('.grp-btn', block).forEach(btn => {
			btn.hidden = !can;
			btn.textContent = grouped ? '[-]' : '[+]';
			btn.title = grouped ? 'Odvoji prozor od skupine' : 'Spoji prozor s prozorima koje dodiruje';
		});
		fitWidget(block); // the cluster may have changed width
	});
}

// where the members stand, to move them from
/** @param {HTMLElement[]} members */
export function groupStarts(members) {
	return members.map(block => {
		const rect = block.getBoundingClientRect();
		return { block, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
	});
}

export function groupBox(starts) {
	const left = Math.min(...starts.map(s => s.left)), top = Math.min(...starts.map(s => s.top));
	const right = Math.max(...starts.map(s => s.right)), bottom = Math.max(...starts.map(s => s.bottom));
	return { left, top, width: right - left, height: bottom - top };
}

// the members moved by one offset, the group's box kept in the viewport as
// placePopout() keeps a widget. Not rounded to whole pixels: a locked widget's
// bottom edge falls on a fraction, and one magneted under it would overlap it
// by half a pixel. Thousandths, as the layout unit is 1/64px
export function moveGroup(starts, box, dx, dy) {
	const left = Math.min(Math.max(0, box.left + dx), Math.max(0, viewportWidth() - box.width));
	const top = Math.min(Math.max(0, box.top + dy), Math.max(0, viewportHeight() - box.height));
	dx = left - box.left;
	dy = top - box.top;
	starts.forEach(s => {
		s.block.style.left = `${subpixel(s.left + dx)}px`;
		s.block.style.top = `${subpixel(s.top + dy)}px`;
	});
}

// how the members stand to one another: for every ordered pair that touches,
// which edge of `to` lies on which of `from` (below: to's top on from's
// bottom, and so on), and, along that edge, which like edges line up. The
// alignments come first, the touch last, so it wins where both pull one axis
export function groupRelations(starts) {
	const near = (p, q) => Math.abs(p - q) <= GROUP_TOUCH;
	const relations = [];
	starts.forEach(from => starts.forEach(to => {
		if (from === to) return;
		const alongX = Math.min(from.right, to.right) - Math.max(from.left, to.left) > 0;
		const alongY = Math.min(from.bottom, to.bottom) - Math.max(from.top, to.top) > 0;
		const stacked = alongX && (near(to.top, from.bottom) || near(to.bottom, from.top));
		const beside = alongY && (near(to.left, from.right) || near(to.right, from.left));
		if (stacked) {
			if (near(to.left, from.left)) relations.push({ from, to, kind: 'alignLeft' });
			if (near(to.right, from.right)) relations.push({ from, to, kind: 'alignRight' });
			relations.push({ from, to, kind: near(to.top, from.bottom) ? 'below' : 'above' });
		}
		if (beside) {
			if (near(to.top, from.top)) relations.push({ from, to, kind: 'alignTop' });
			if (near(to.bottom, from.bottom)) relations.push({ from, to, kind: 'alignBottom' });
			relations.push({ from, to, kind: near(to.left, from.right) ? 'right' : 'left' });
		}
	}));
	return relations;
}
