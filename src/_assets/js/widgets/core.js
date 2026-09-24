// What every widget module shares: the widgets on screen, where one may go,
// and the stacking order.

import { cssNumber, queryAll } from '../lib/dom.js';
import { subpixel, viewportHeight, viewportWidth } from '../lib/geometry.js';
import { mapTypeOf } from '../maps/types.js';
import { isDashboard } from './board.js';
import { POPOUT_MARGIN, POPOUT_MAX_WIDTH, POPOUT_TITLE_HEIGHT } from './constants.js';
import { groupMembers } from './groups.js';
import { refreshOverlap } from './overlap.js';

// The widgets' stacking band, from the stylesheet's layers: a raise takes the
// next number, and the order is packed down when the band runs out
// (INTERNALS.md, Stacking)
let popoutZ = 0;

function widgetsBand() {
	return { base: cssNumber('--z-widgets', 5000), top: cssNumber('--z-widgets-top', 7999) };
}

// every widget's place in the order kept, the numbers dealt afresh from the
// bottom of the band; a widget hosting a fullscreen map keeps the layer it has
function repackPopouts(base) {
	popoutZ = base;
	allPopouts()
		.filter(block => !block.classList.contains('fs-host'))
		.sort((a, b) => (Number(a.style.zIndex) || 0) - (Number(b.style.zIndex) || 0))
		.forEach(block => block.style.zIndex = String(++popoutZ));
}

// iframes have no intrinsic aspect, so their widgets resize in both dimensions;
// images, slideshows and videos keep the height their aspect ratio gives them
/** @param {HTMLElement} block */
export function isFreePopout(block) {
	const type = mapTypeOf(block.dataset.mapId);
	return !!type && type.freeAspect;
}

// the widest a widget goes: the list's width over the page, which is where
// that cap comes from, and the whole viewport on the board, which has no list
// to relate to — a board of half-width tiles needs more than 875 of a wide screen
export function popoutMaxWidth() {
	return isDashboard() ? viewportWidth() : Math.min(POPOUT_MAX_WIDTH, viewportWidth() - POPOUT_MARGIN);
}

// keep the whole widget inside the viewport when it fits, else at least its
// top-left corner so the title bar can always be grabbed
/** @param {HTMLElement} block */
export function placePopout(block, left, top) {
	const maxLeft = Math.max(0, viewportWidth() - block.offsetWidth);
	const maxTop = Math.max(0, viewportHeight() - Math.max(block.offsetHeight, POPOUT_TITLE_HEIGHT));
	block.style.left = `${subpixel(Math.min(Math.max(0, left), maxLeft))}px`;
	block.style.top = `${subpixel(Math.min(Math.max(0, top), maxTop))}px`;
}

// a grouped widget comes up with its group, the order within it kept
/** @param {HTMLElement} block */
export function raisePopout(block) {
	const members = groupMembers(block);
	const band = widgetsBand();
	if (popoutZ < band.base) popoutZ = band.base;
	if (popoutZ + members.length > band.top) repackPopouts(band.base);
	members
		.sort((a, b) => (Number(a.style.zIndex) || 0) - (Number(b.style.zIndex) || 0))
		.forEach(member => member.style.zIndex = String(++popoutZ));
	refreshOverlap();
}

// the image a widget shows: the active slide's, or the map's own
/** @param {HTMLElement} block @returns {HTMLImageElement | null} */
export function shownImage(block) {
	return /** @type {HTMLImageElement | null} */ (block.querySelector('.slide.active img') || block.querySelector('.placeholder img'));
}

export function allPopouts() {
	return queryAll('.map-block.popout');
}

export function floatingBlocks() {
	return queryAll('.map-block.popout:not(.snapped)');
}
