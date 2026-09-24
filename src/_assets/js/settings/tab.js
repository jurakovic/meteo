// The tab at the top edge: the way to the dialog where the page's own Karte
// button is out of reach (the board, a hidden page), with the board's glyphs.
//
// the fixed tab to the dialog can be dragged along the top edge and pulled
// wider or narrower by either side — no narrower than its name, no wider
// than msTabMaxWidth(), held inside the viewport — and where it was put is
// remembered in this browser only (msTab: the left as a fraction of the
// viewport, the width in px), not in the arrangement; a click that did not
// move opens the dialog

import { el, query } from '../lib/dom.js';
import { EVENTS, on } from '../lib/events.js';
import { clamp, roundFraction, viewportWidth } from '../lib/geometry.js';
import { trackPointer } from '../lib/pointer.js';
import { readJson, STORAGE_KEYS, writeJson } from '../lib/storage.js';
import { withKey } from '../page/commands.js';
import { SNAP_ARM } from '../widgets/constants.js';
import { isGridShown, isGridSnapped } from '../widgets/grid.js';
import { isRefreshOn, refreshLabel } from '../widgets/refresh.js';
import { toggleMapSettings } from './panel.js';

const MS_TAB_EDGE = 8; // a press this close to a side resizes; elsewhere drags

let msTabMoved = false; // the release of a drag is no click

function loadMsTab() {
	const tab = readJson(STORAGE_KEYS.tab);
	return tab && typeof tab === 'object' && Number.isFinite(tab.left) && Number.isFinite(tab.width) ? tab : null;
}

function saveMsTab(tab) {
	const rect = tab.getBoundingClientRect();
	writeJson(STORAGE_KEYS.tab, { left: roundFraction(rect.left / viewportWidth()), width: Math.round(rect.width) });
}

// the width its name takes is the narrowest it goes: measured with the width
// unset (0 while it is not shown), and as a sized tab, without the room the
// name is given while nobody has sized it
function msTabMinWidth(tab) {
	const width = tab.style.width;
	const sized = tab.classList.contains('ms-tab-sized');
	tab.style.width = '';
	tab.classList.add('ms-tab-sized');
	const min = Math.ceil(tab.getBoundingClientRect().width); // up: offsetWidth rounds, and a fraction short ellipsises the name
	tab.style.width = width;
	tab.classList.toggle('ms-tab-sized', sized);
	return min;
}

// half the viewport rather than a fixed number of pixels: the tab is the one
// way to the dialog and not a bar of its own, so how much of the top edge it
// may take is a share of that edge. Read on every place instead of stored, so
// a window resized under it holds it to the half it has now
function msTabMaxWidth() {
	return viewportWidth() / 2;
}

// the floor beats the ceiling: on a narrow window the name and the cluster can
// take more than half of it, and a tab cut below what they need would ellipsise
// its own name for nothing
function msTabWidth(tab, width) {
	const min = msTabMinWidth(tab);
	return clamp(width, min, Math.max(min, msTabMaxWidth()));
}

function placeMsTab(tab, left, width) {
	width = msTabWidth(tab, width);
	left = clamp(left, 0, Math.max(0, viewportWidth() - width));
	tab.style.width = `${Math.round(width)}px`;
	tab.style.left = `${Math.round(left)}px`;
	tab.style.transform = 'none'; // off the centring
	tab.classList.add('ms-tab-sized'); // the width is this one now, not the name's plus its room
}

export function applyStoredMsTab() {
	const tab = document.querySelector('.ms-tab');
	const stored = loadMsTab();
	if (tab && stored) placeMsTab(tab, stored.left * viewportWidth(), stored.width);
}

// On a board the tab is the only chrome there is, so it carries the same glyph
// cluster a widget's title bar does, and for the same reason: the common moves
// without opening the dialog. [R] reloads every widget's map (widgets/reload.js), [G]
// and [S] are the board's two grid switches — the dialog's own, through
// setGridPrefs, so the three places cannot disagree. Each glyph is the key that
// does the same thing, and says so in its title, the way the tab itself does.
// They are <a> without href, as the title bars' glyphs are, so they are no
// interactive content inside the button; their click is kept off the tab's own
function buildMsTabCluster(tab) {
	// the board's own way to add a map, without the dialog (see openMsAdd)
	const glyph = (text, command, title, extra = {}) =>
		el('a', { class: 'ms-tab-btn', ...extra, 'data-action': command, text, title: withKey(title, command) });
	const add = glyph('[+]', 'add-map', 'Dodaj kartu na ploču', { class: 'ms-tab-btn ms-tab-board ms-tab-add' });
	const reload = glyph('[R]', 'reload', 'Osvježi sve karte');
	// the board's three, which do nothing off it and are not offered there
	const arrange = glyph('[A]', 'arrange', 'Posloži u mrežu', { class: 'ms-tab-btn ms-tab-board' });
	const grid = glyph('[G]', 'grid-show', 'Prikaži mrežu', { class: 'ms-tab-btn ms-tab-board', 'data-grid': 'show' });
	const snap = glyph('[S]', 'grid-snap', 'Poravnaj uz mrežu', { class: 'ms-tab-btn ms-tab-board', 'data-grid': 'snap' });
	const count = el('span', { class: 'ms-tab-count', title: 'Do sljedećeg osvježavanja' });
	tab.appendChild(el('span', { class: 'ms-tab-cluster' }, [add, reload, arrange, grid, snap, count]));
	syncMsTab();
}

// the two switches say whether they are on by being lit or dimmed, as the
// dialog's greys its own off the board. On grid-changed, wherever the switch
// was flipped — the dialog, a key, or the glyph itself. [R] is an action and
// has nothing to be on or off about
function syncMsTab() {
	const tab = document.querySelector('.ms-tab');
	if (!tab) return;
	const show = tab.querySelector('[data-grid="show"]');
	const snap = tab.querySelector('[data-grid="snap"]');
	if (show) show.classList.toggle('ms-tab-off', !isGridShown());
	if (snap) snap.classList.toggle('ms-tab-off', !isGridSnapped());
	syncRefreshLabel();
}

// the countdown, on every tick; the dialog's own row keeps its copy
// (settings/panel-rows.js)
function syncRefreshLabel() {
	const count = document.querySelector('.ms-tab .ms-tab-count');
	if (count) count.textContent = isRefreshOn() ? refreshLabel() : '';
}

export function initMsTab() {
	const tab = query('.ms-tab');
	if (!tab) return;
	// a press on one of the glyphs is the glyph's, not the tab's
	const onGlyph = (/** @type {Event} */ e) => !!/** @type {Element} */ (e.target).closest('.ms-tab-btn');
	tab.title = withKey('Karte', 'map-settings');
	buildMsTabCluster(tab); // before the first measure: the glyphs are part of the width its name gives it
	applyStoredMsTab();
	tab.addEventListener('click', (e) => {
		if (onGlyph(e)) return; // a glyph is itself, as on a title bar
		if (msTabMoved) { msTabMoved = false; return; }
		toggleMapSettings();
	});
	// the cursor says which it will be
	tab.addEventListener('pointermove', (e) => {
		if (onGlyph(e)) { tab.style.cursor = ''; return; }
		const rect = tab.getBoundingClientRect();
		const side = e.clientX - rect.left <= MS_TAB_EDGE || rect.right - e.clientX <= MS_TAB_EDGE;
		tab.style.cursor = side ? 'ew-resize' : '';
	});
	tab.addEventListener('pointerdown', (e) => {
		if (e.button !== 0 || onGlyph(e)) return;
		e.preventDefault();
		const rect = tab.getBoundingClientRect();
		const mode = e.clientX - rect.left <= MS_TAB_EDGE ? 'w' : rect.right - e.clientX <= MS_TAB_EDGE ? 'e' : 'move';
		msTabMoved = false;
		trackPointer(e, (dx) => {
			if (!msTabMoved && Math.abs(dx) < SNAP_ARM) return; // a click must not move it
			msTabMoved = true;
			if (mode === 'move') placeMsTab(tab, rect.left + dx, rect.width);
			else if (mode === 'e') placeMsTab(tab, rect.left, rect.width + dx);
			else {
				const width = msTabWidth(tab, rect.width - dx);
				placeMsTab(tab, rect.right - width, width); // the right side stays
			}
		}, () => { if (msTabMoved) saveMsTab(tab); });
	});
	window.addEventListener('resize', applyStoredMsTab); // held inside the viewport
	on(EVENTS.gridChanged, syncMsTab);
	on(EVENTS.refreshTick, syncRefreshLabel);
	// the countdown coming or going changes how narrow the tab may be
	on(EVENTS.refreshChanged, applyStoredMsTab);
}
