// The board (desktop): the page out of sight and every map of the list a
// widget. See INTERNALS.md, The board.

import { dlog } from '../lib/debug.js';
import { query, queryAll } from '../lib/dom.js';
import { viewportHeight } from '../lib/geometry.js';
import { catalogMap } from '../maps/catalog.js';
import { addMapToList, removeMapFromList } from '../maps/prefs.js';
import { appendMapRows } from '../maps/render.js';
import { updateLinksScrollShadow } from '../page/links.js';
import { snapColumn, snapColumnPx } from './columns.js';
import { CASCADE_STEP, POPOUT_MARGIN, POPOUT_WIDTH } from './constants.js';
import { pageShowing, wireDuplicate } from './copies.js';
import { placePopout, raisePopout } from './core.js';
import { renderGrid } from './grid.js';
import { updateGroups } from './groups.js';
import { arrangementChanged, withPersistPaused } from './layout.js';
import { syncShadows } from './overlap.js';
import { dockMap, fitWidget, popoutMap, setPopoutButton, WIDGET_RENDER } from './popout.js';

let dashboardMode = false;

export function isDashboard() {
	return dashboardMode;
}

// the class first: the page's scrollbar goes with it, changing the viewport
// everything after is measured in; the buttons read the mode
/** @param {boolean} on */
export function setDashboard(on) {
	dashboardMode = on;
	document.body.classList.toggle('dashboard', on);
	renderGrid(); // the paper is the board's
	queryAll('.map-block.popout .po-btn').forEach(btn => setPopoutButton(btn, true));
}

// every map of the list not popped out yet becomes a widget, one after
// another down a cascade from the top left of what the columns leave; once
// it would run off the bottom the next round starts at the top again, half
// a widget further right
export function popoutRest() {
	let top = POPOUT_MARGIN, round = 0;
	queryAll('.map-block:not(.popout)').forEach(block => {
		popoutMap(block);
		// the step is the cascade's own count, not one per widget height
		// (INTERNALS.md, The board). The first of a round goes down whatever its
		// height, or one taller than the viewport would start a round for ever
		if (top > POPOUT_MARGIN && top + block.offsetHeight > viewportHeight()) {
			top = POPOUT_MARGIN;
			round++;
		}
		placePopout(block,
			snapColumnPx(snapColumn('left')) + POPOUT_MARGIN + (top - POPOUT_MARGIN) + round * POPOUT_WIDTH / 2,
			top);
		raisePopout(block);
		top += CASCADE_STEP;
	});
}

// [x] on the board, on a map's last showing: the widget goes, its entry in
// the (hidden) list with it, and the list is stored without it (maps/prefs.js)
/** @param {HTMLElement} block */
export function removeFromDashboard(block) {
	dlog(`removeFromDashboard: ${block.dataset.mapId}`);
	const id = block.dataset.mapId;
	withPersistPaused(() => dockMap(block)); // out of its column and group, a fullscreen taken down
	block.closest('.map-entry').remove(); // with the links under it
	removeMapFromList(id);
}

// the tab's [+]: the map joins the end of the list and comes on at the
// cascade's first step. Nothing is rendered again, so nothing else reloads
/** @param {string} mapId */
export function addToDashboard(mapId) {
	const map = catalogMap(mapId);
	const list = document.querySelector('[data-maps]');
	if (!map || !list || !isDashboard() || pageShowing(mapId)) return;
	dlog(`addToDashboard: ${mapId}`);
	addMapToList(mapId);
	const empty = list.querySelector('.maps-empty');
	if (empty) list.replaceChildren(); // the "nothing selected" line
	const block = appendMapRows(list, map, WIDGET_RENDER);
	const links = query('.links-bottom', block.parentElement);
	if (links) links.addEventListener('scroll', () => updateLinksScrollShadow(links), { passive: true });
	wireDuplicate(block); // its own wiring and only its own, as a copy's
	popoutRest();
	fitWidget(block);
	updateGroups();
	syncShadows();
	arrangementChanged();
	return block;
}
