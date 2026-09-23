// What every widget module shares: the widgets on screen, where one may go,
// and the stacking order.

import { subpixel, viewportHeight, viewportWidth } from '../lib/geometry.js';
import { dashboardMode } from './board.js';
import { POPOUT_MARGIN, POPOUT_MAX_WIDTH, POPOUT_TITLE_HEIGHT } from './constants.js';
import { groupMembers } from './groups.js';
import { updateCovered } from './overlap.js';

let popoutZ = 5000; // bumped on every raise so the last touched widget is on top

// iframes have no intrinsic aspect, so their widgets resize in both dimensions;
// images, slideshows and videos keep the height their aspect ratio gives them
export function isFreePopout(block) {
	return !!block.querySelector('.if1, .if2');
}

// the widest a widget goes: the table's width over the page, which is where
// that cap comes from, and the whole viewport on the board, which has no table
// to relate to — a board of half-width tiles needs more than 875 of a wide screen
export function popoutMaxWidth() {
	return dashboardMode ? viewportWidth() : Math.min(POPOUT_MAX_WIDTH, viewportWidth() - POPOUT_MARGIN);
}

// keep the whole widget inside the viewport when it fits, else at least its
// top-left corner so the title bar can always be grabbed
export function placePopout(block, left, top) {
	const maxLeft = Math.max(0, viewportWidth() - block.offsetWidth);
	const maxTop = Math.max(0, viewportHeight() - Math.max(block.offsetHeight, POPOUT_TITLE_HEIGHT));
	block.style.left = `${subpixel(Math.min(Math.max(0, left), maxLeft))}px`;
	block.style.top = `${subpixel(Math.min(Math.max(0, top), maxTop))}px`;
}

// a grouped widget comes up with its group, the order within it kept
export function raisePopout(block) {
	groupMembers(block)
		.sort((a, b) => (Number(a.style.zIndex) || 0) - (Number(b.style.zIndex) || 0))
		.forEach(member => member.style.zIndex = ++popoutZ);
	updateCovered();
}

export function allPopouts() {
	return [...document.querySelectorAll('.map-block.popout')];
}

export function floatingBlocks() {
	return [...document.querySelectorAll('.map-block.popout:not(.snapped)')];
}
