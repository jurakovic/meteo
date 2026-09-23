// The customize page's maps: the view it shows (maps/prefs.js) drawn into
// <div data-maps>, every title bar with the widgets' buttons.
//
// Which maps are off comes from remote-config.js (isMapEnabled). Off is hidden,
// not removed: lists, presets and links keep the id, and the map is back in
// its place in the list once it is on again. Not on the screen, though: the
// arrangement is written off what is up, so the next write drops a map that is
// off, and on again it comes in where any map new to the view does (docked,
// or down the cascade on a board). Only what is shown leaves it out — the
// render, the tab's [+] menu and the dialog's rows (hidden, not left out, so a
// list saved from the dialog still holds it)
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

export function initRerender() {
	on(EVENTS.mapConfigChanged, () => {
		if (mapsRendered) rerenderMaps();
	});
}

export function renderMaps() {
	const list = document.querySelector('[data-maps]');
	if (!list) return;
	// a fullscreen map goes with the list too, and would leave the page's
	// scroll locked behind it; taken down as the arrangement it is part of
	// is (what comes back is applied after the render)
	withPersistPaused(() => document.querySelectorAll('.if1.fullscreen').forEach(exitFullscreen));
	resetSnapColumns(); // their panes go with the list
	mapsRendered = true;
	const maps = resolveMapIds().map(catalogMap).filter(map => map && isMapEnabled(map.id));
	renderMapRows(list, maps, WIDGET_RENDER);
}

// the remote config changed under maps already out: the view is drawn again the
// way Primijeni draws it, the arrangement carried over from the screen, so a map
// switched off goes and one switched on comes back — docked on the page, down
// the cascade on a board. Every frame reloads, which a config change is rare
// enough to afford
function rerenderMaps() {
	const layout = sanitizeSnapLayout(currentSnapLayout(), resolveMapIds());
	closeMsAdd();
	renderMaps();
	initDynamicContent();
	applySnapLayout(layout);
}
