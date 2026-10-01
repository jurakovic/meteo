// The customize page's maps: the view it shows (maps/prefs.js) drawn into
// <div data-maps>, every title bar with the widgets' buttons. A map switched
// off is left out (INTERNALS.md, Remote config).
import { queryAll } from '../lib/dom.js';
import { EVENTS, on } from '../lib/events.js';
import { initDynamicContent } from '../page/content.js';
import { exitFullscreen } from '../page/iframe.js';
import { isMapEnabled } from '../remote-config.js';
import { closeMsAdd } from '../settings/add-menu.js';
import { resetSnapColumns } from '../widgets/columns.js';
import { applySnapLayout, currentSnapLayout, sanitizeSnapLayout, withPersistPaused } from '../widgets/layout.js';
import { WIDGET_RENDER } from '../widgets/popout.js';
import { catalogMap } from './catalog.js';
import { resolveMapIds } from './prefs.js';
import { renderMapRows } from './render.js';

let mapsRendered = false; // from the first render on, a change is applied in place
let renderedIds = ''; // the maps the last render drew, joined

// the view's maps less those switched off
function viewMaps() {
	return resolveMapIds().map(catalogMap).filter(map => map && isMapEnabled(map.id));
}

export function initRerender() {
	on(EVENTS.mapConfigChanged, () => {
		if (!mapsRendered) return;
		closeMsAdd(); // it can list the map switched
		// a switch on a map the view does not hold leaves it as drawn
		if (viewMaps().map(map => map.id).join() !== renderedIds) rerenderMaps();
	});
}

export function renderMaps() {
	const list = document.querySelector('[data-maps]');
	if (!list) return;
	// a fullscreen map goes with the list too, and would leave the page's
	// scroll locked behind it; taken down as the arrangement it is part of
	// is (what comes back is applied after the render)
	withPersistPaused(() => queryAll('.if1.fullscreen').forEach(exitFullscreen));
	resetSnapColumns(); // their panes go with the list
	mapsRendered = true;
	const maps = viewMaps();
	renderedIds = maps.map(map => map.id).join();
	renderMapRows(list, maps, WIDGET_RENDER);
}

// the remote config changed: the view is drawn again as Primijeni draws it,
// the arrangement carried over from the screen. Every frame reloads, which a
// config change is rare enough to afford
function rerenderMaps() {
	const layout = sanitizeSnapLayout(currentSnapLayout(), resolveMapIds());
	renderMaps();
	initDynamicContent();
	applySnapLayout(layout);
}
