// The dashboard (desktop).
//
// the page out of sight and every map of the list a widget, floating or in a
// column — a mode of the view, `dashboard: true` on the layout, so it rides
// with the list in the preferences, a saved preset and a share link, and
// comes back with them (applySnapLayout). Which is also the only way onto it:
// the dialog's mode row ticks the mode and Primijeni applies it with the list,
// so nothing enters the board on its own. Left the same way, or by docking
// everything (Vrati sve, the breakpoint). On the board the widget's [=] is [x]
// and takes the map off the list; a map added to the list comes onto the board
// at the next free step of a cascade (popoutRest). Desktop only, like the
// widgets: the breakpoint docks everything, with persistence paused, so the
// stored view keeps the mode

import { dlog } from '../lib/debug.js';
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
import { dockMap, fitWidget, popoutMap, setPopoutButton } from './popout.js';

let dashboardMode = false;

export function isDashboard() {
	return dashboardMode;
}

// the class first: the page's scrollbar goes with it, changing the viewport
// everything after is measured in; the buttons read the mode
export function setDashboard(on) {
	dashboardMode = on;
	document.body.classList.toggle('dashboard', on);
	renderGrid(); // the paper is the board's
	document.querySelectorAll('.map-block.popout .po-btn').forEach(btn => setPopoutButton(btn, true));
}

// every map of the list not popped out yet becomes a widget, one after
// another down a cascade from the top left of what the columns leave; once
// it would run off the bottom the next round starts at the top again, half
// a widget further right
export function popoutRest() {
	let top = POPOUT_MARGIN, round = 0;
	document.querySelectorAll('.map-block:not(.popout)').forEach(block => {
		popoutMap(block);
		// the widget's own height says whether it still fits, but the step it
		// lands on is the cascade's own count rather than a number of steps
		// derived from that height: widgets are of every height, so a per-widget
		// count is a different modulus for each and lands several of them on the
		// very same place. The first of a round goes down whatever its height, or
		// one taller than the viewport would start a round of its own for ever
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

// [x] on the board, on a map's last showing: the map leaves the list it is
// shown from — the widget goes, with its rows in the (hidden) table, and the
// list is stored without it (maps/prefs.js), as the dialog would store it after the
// map was unticked
export function removeFromDashboard(block) {
	dlog(`removeFromDashboard: ${block.dataset.mapId}`);
	const id = block.dataset.mapId;
	withPersistPaused(() => dockMap(block)); // out of its column and group, a fullscreen taken down
	const row = block.closest('tr');
	const next = row.nextElementSibling;
	const links = next && next.querySelector('.links-bottom') ? next : null;
	const last = links || row;
	const spacer = row.previousElementSibling && row.previousElementSibling.classList.contains('sp20') ? row.previousElementSibling
		: last.nextElementSibling && last.nextElementSibling.classList.contains('sp20') ? last.nextElementSibling : null;
	[links, spacer, row].forEach(node => { if (node) node.remove(); });
	removeMapFromList(id);
}

// the tab's [+], the other way round: the map joins the end of the list, its
// rows join the end of the (hidden) table the way the render would have laid
// them, and it comes onto the board the way any map new to the list does, at
// the cascade's first step (popoutRest — every other map is a widget already).
// Nothing is rendered again, so nothing else on the board reloads
export function addToDashboard(mapId) {
	const map = catalogMap(mapId);
	const tbody = document.querySelector('tbody[data-maps]');
	if (!map || !tbody || !isDashboard() || pageShowing(mapId)) return;
	dlog(`addToDashboard: ${mapId}`);
	addMapToList(mapId);
	const empty = tbody.querySelector('.maps-empty');
	if (empty) tbody.replaceChildren(); // the "nothing selected" row
	const block = appendMapRows(tbody, map);
	const links = tbody.lastElementChild.querySelector('.links-bottom');
	if (links) links.addEventListener('scroll', () => updateLinksScrollShadow(links), { passive: true });
	wireDuplicate(block); // its own wiring and only its own, as a copy's
	popoutRest();
	fitWidget(block);
	updateGroups();
	syncShadows();
	arrangementChanged();
	return block;
}
