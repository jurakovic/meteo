// The landing page's maps: the default view, always the same, drawn from the
// catalog the way the customize page draws it, without the widgets. The built
// page carries the rows already (INTERNALS.md, Maps). A map switched off
// remotely (remote-config.js) is left out, and the list is drawn again when
// that changes.
import { EVENTS, on } from '../lib/events.js';
import { initDynamicContent } from '../page/content.js';
import { isMapEnabled } from '../remote-config.js';
import { catalogMap, DEFAULT_MAPS } from './catalog.js';
import { renderMapRows } from './render.js';

// the ids of the maps the list holds, in order
/** @param {Element} list */
function listedMapIds(list) {
	return [...list.querySelectorAll(':scope > .map-entry > .map-block')]
		.map(block => /** @type {HTMLElement} */ (block).dataset.mapId);
}

// draws the list, unless it holds those maps already (the built page's rows,
// while none of them is switched off); whether it drew
export function renderLanding() {
	const list = document.querySelector('[data-maps]');
	if (!list) return false;
	const maps = DEFAULT_MAPS.map(catalogMap).filter(map => map && isMapEnabled(map.id));
	const ids = maps.map(map => map.id);
	if (ids.length && listedMapIds(list).join() === ids.join()) return false;
	renderMapRows(list, maps);
	return true;
}

export function initLandingRerender() {
	on(EVENTS.mapConfigChanged, () => {
		if (renderLanding()) initDynamicContent();
	});
}
