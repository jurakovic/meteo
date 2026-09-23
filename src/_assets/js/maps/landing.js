// The landing page's maps: the default view, always the same, drawn from the
// catalog the way the customize page draws it, without the widgets. A map
// switched off remotely (remote-config.js) is left out, and the list is drawn
// again when that changes.
import { EVENTS, on } from '../lib/events.js';
import { initDynamicContent } from '../page/content.js';
import { isMapEnabled } from '../remote-config.js';
import { catalogMap, DEFAULT_MAPS } from './catalog.js';
import { renderMapRows } from './render.js';

export function renderLanding() {
	const list = document.querySelector('[data-maps]');
	if (!list) return;
	renderMapRows(list, DEFAULT_MAPS.map(catalogMap).filter(map => map && isMapEnabled(map.id)));
}

export function initLandingRerender() {
	on(EVENTS.mapConfigChanged, () => {
		renderLanding();
		initDynamicContent();
	});
}
