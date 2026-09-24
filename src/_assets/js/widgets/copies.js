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

// [D] makes another showing of a map, and no showing is the original: any can
// be closed while the others stay. The page keeps one entry per map, and its
// place to dock into belongs to the showing not marked .duplicate; closing that
// one hands the place on (removeShowing), so only the last showing docks (on
// the board, leaves the list). A copy is built from the catalog, not cloned,
// so its slideshow and frame ids are its own (maps/render.js: instSuffix)
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

// the copy's own wiring and only its own. initDynamicContent() sweeps the page,
// and setting an iframe's src again reloads every interactive map already on
// screen, costing each of them its pan and its zoom; the two sweeps below are
// safe because they bind once per node and skip what is bound (page/slideshow.js, page/iframe.js)
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
	// the size of the widget it came from: its width, and its height too where
	// the height is its own (an interactive map, or a map freed of its aspect,
	// which the copy is freed of as well), held to the widget limits like a
	// stored one — a pane's width is its column's and may be wider. A map
	// copied from the page starts at the size any widget starts at
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

// the block a stored entry names: the plain key is the showing that holds the
// page's place, whatever it is called by now; any other key is a copy, made
// here under a free name (a stored key is a position in the layout, not a name
// anything on screen answers to)
/** @param {string} inst */
export function instanceFor(inst) {
	const mapId = instMapId(inst);
	if (instIndex(inst) === 1) return pageShowing(mapId);
	const copy = blockByInst(inst);
	return copy && isDuplicate(copy) ? copy : makeDuplicate(mapId, freeInstance(mapId));
}

// a showing closed while others of its map stay out: it goes, and if it held
// the page's place, the next showing takes the place over — the gap and its
// way back with it. Nothing moves in the DOM for that (an iframe would reload):
// every other showing is a widget, fixed, so the heir docks where the gap is
// from wherever it sits in the row
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
