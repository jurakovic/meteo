import { dlog } from '../lib/debug.js';
import { el, query, queryAll } from '../lib/dom.js';
import { clamp, viewportHeight } from '../lib/geometry.js';
import { DESKTOP_MQ } from '../lib/media.js';
import { catalogMap } from '../maps/catalog.js';
import { buildMapContent, instIndex, instKey, instMapId } from '../maps/render.js';
import { withKey } from '../page/commands.js';
import { exitFullscreen, hideOverlayOnDoubleTap, setIframeSrc, updateHintText } from '../page/iframe.js';
import { addSwipeEvents } from '../page/slideshow.js';
import { unsnapPane } from './columns.js';
import { CASCADE_STEP, POPOUT_MIN_HEIGHT, POPOUT_MIN_WIDTH } from './constants.js';
import { placePopout, popoutMaxWidth, raisePopout } from './core.js';
import { groupOf, leaveGroup, updateGroups } from './groups.js';
import { arrangementChanged } from './layout.js';
import { dropShadow, syncShadows } from './overlap.js';
import { fitWidget, handGapTo, popoutMap, unlockAspect, WIDGET_RENDER } from './popout.js';

// [D]: another showing of a map. See INTERNALS.md, Copies.
export function buildDuplicateButton() {
	const btn = el('a', { class: 'dup-btn', text: '[D]', title: withKey('Udvostruči kartu', 'duplicate') });
	btn.addEventListener('click', () => duplicateMap(btn.closest('.map-block')));
	return btn;
}

/** @param {HTMLElement} block */
export function isDuplicate(block) {
	return !!block && block.classList.contains('duplicate');
}

function showingsOf(mapId) {
	return queryAll(`.map-block[data-map-id="${CSS.escape(mapId)}"]`);
}

/** @param {HTMLElement} block */
export function otherShowings(block) {
	return showingsOf(block.dataset.mapId).filter(b => b !== block);
}

// the showing that holds the map's place in the page
/** @param {string} mapId */
export function pageShowing(mapId) {
	return showingsOf(mapId).find(b => !isDuplicate(b)) || null;
}

function blockByInst(inst) {
	return query(`.map-block[data-inst="${CSS.escape(inst)}"]`);
}

// the lowest free index for this map, so closing the middle showing of three
// and making another gives back the name that was freed rather than climbing —
// the first one's too, once the showing that bore it has been closed
function freeInstance(mapId) {
	for (let index = 1; ; index++) {
		const inst = instKey(mapId, index);
		if (!blockByInst(inst)) return inst;
	}
}

// the copy's wiring and only its own: initDynamicContent() would set every
// iframe's src again. The two sweeps below skip what they have bound already
/** @param {HTMLElement} block */
export function wireDuplicate(block) {
	block.querySelectorAll('img.lazy').forEach((/** @type {HTMLImageElement} */ img) => {
		img.src = img.getAttribute('data-src');
		img.classList.remove('lazy');
	});
	block.querySelectorAll('iframe[data-zoom-hr-desktop]').forEach((/** @type {HTMLIFrameElement} */ iframe) => setIframeSrc(iframe));
	addSwipeEvents();
	hideOverlayOnDoubleTap();
	updateHintText();
}

function makeDuplicate(mapId, inst) {
	const map = catalogMap(mapId);
	const origin = pageShowing(mapId);
	if (!map || !origin) return null;
	const block = el('div', { class: 'map-block duplicate', 'data-map-id': mapId, 'data-inst': inst },
		buildMapContent(map, inst, WIDGET_RENDER));
	// beside the map it copies, so the list's order still reads off the DOM
	// (arrangeBoard) and a map dropped from the list takes its copies with it.
	// It holds no place in the page, so it asks the page for no room
	origin.after(block);
	wireDuplicate(block);
	return block;
}

/** @param {HTMLElement} block */
export function duplicateMap(block) {
	if (!block || !DESKTOP_MQ.matches) return null;
	const mapId = block.dataset.mapId;
	const inst = freeInstance(mapId);
	dlog(`duplicateMap: ${mapId} -> ${inst}`);
	const copy = makeDuplicate(mapId, inst);
	if (!copy) return null;
	popoutMap(copy);
	const popped = block.classList.contains('popout');
	// the size of the widget it came from, held to the widget limits: a pane's
	// width is its column's and may be wider (INTERNALS.md, Copies)
	if (popped) {
		const size = block.getBoundingClientRect();
		if (block.classList.contains('free') && !copy.classList.contains('free')) unlockAspect(copy);
		copy.style.width = `${Math.round(clamp(size.width, POPOUT_MIN_WIDTH, popoutMaxWidth()))}px`;
		if (copy.classList.contains('free'))
			copy.style.height = `${Math.round(clamp(size.height, POPOUT_MIN_HEIGHT, viewportHeight()))}px`;
	}
	// a step off the widget it came from, the way a cascade steps, so it is
	// plainly a second thing and not the first one having jumped
	const from = popped ? block.getBoundingClientRect() : copy.getBoundingClientRect();
	placePopout(copy, from.left + CASCADE_STEP, from.top + CASCADE_STEP);
	raisePopout(copy);
	fitWidget(copy);
	updateGroups();
	syncShadows();
	arrangementChanged();
	return copy;
}

// the block a stored entry names: the plain key is the showing holding the
// page's place; any other key is a copy, made here under a free name
/** @param {string} inst */
export function instanceFor(inst) {
	const mapId = instMapId(inst);
	if (instIndex(inst) === 1) return pageShowing(mapId);
	const copy = blockByInst(inst);
	return copy && isDuplicate(copy) ? copy : makeDuplicate(mapId, freeInstance(mapId));
}

// a showing closed while others of its map stay out; if it held the page's
// place, the next showing inherits it (INTERNALS.md, Copies)
/** @param {HTMLElement} block */
export function removeShowing(block) {
	dlog(`removeShowing: ${block.dataset.inst}`);
	if (!isDuplicate(block)) {
		const heir = otherShowings(block)[0];
		if (heir) {
			heir.classList.remove('duplicate');
			handGapTo(block, heir);
		}
	}
	const fs = query('.if1.fullscreen', block);
	if (fs) exitFullscreen(fs);
	if (groupOf(block)) leaveGroup(block);
	unsnapPane(block);
	dropShadow(block);
	block.remove();
	updateGroups();
	syncShadows();
	arrangementChanged();
}
