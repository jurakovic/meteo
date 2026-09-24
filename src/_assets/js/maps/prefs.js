// The view the customize page shows: the list of maps (a preset or a custom
// pick), stored in this browser — or, while a shared link is open, the view
// that link carries, which overrides the stored one for the session.

import { DESKTOP_MQ } from '../lib/media.js';
import { readJson, STORAGE_KEYS, writeJson } from '../lib/storage.js';
import { arrangementChanged } from '../widgets/layout.js';
import { CATALOG_BY_ID } from './catalog.js';
import { allPresets, getUserPresets, MAP_PRESETS } from './presets.js';
import { decodeMapView, encodeMapView } from './share.js';

// guards both untrusted sources (localStorage, ?v=): 'custom' is a runtime-only
// preset (not in MAP_PRESETS), everything else must name a real preset or it
// can't be selected/rendered — unknown ids (older/newer site version, a deleted
// user preset, hand-crafted ?v=) are rejected so a stale value isn't kept
/**
 * The view the customize page shows, as stored and as a link carries it.
 * @typedef {object} MapPrefs
 * @property {string} preset a preset's id, or 'custom' for a list of its own
 * @property {string[]} [maps] the custom list, in render order
 * @property {import('../widgets/layout.js').SnapLayout | null} [layout] the arrangement
 * @property {string} [name] a shared saved preset's name, offered to save it under
 */

/** @param {any} prefs @returns {boolean} */
export function isValidPrefs(prefs) {
	return prefs && typeof prefs.preset === 'string'
		&& (prefs.preset === 'custom' || allPresets().some(p => p.id === prefs.preset));
}

// read afresh every time: the page and another tab both write it
/** @returns {MapPrefs} */
export function getMapPrefs() {
	const prefs = readJson(STORAGE_KEYS.mapPrefs);
	return isValidPrefs(prefs) ? prefs : { preset: 'zadano' };
}

/** @param {MapPrefs} prefs */
export function saveMapPrefs(prefs) {
	writeJson(STORAGE_KEYS.mapPrefs, prefs);
}

/** @param {string} presetId @returns {string[] | null} */
export function presetMapIds(presetId) {
	const preset = allPresets().find(p => p.id === presetId);
	return preset ? preset.maps : null;
}

/** @returns {string[]} */
export function resolveMapIds() {
	return prefsMapIds(getActiveMapPrefs());
}

// the list the page shows, edited on the board (widgets/board.js) rather than
// in the dialog, stored as a custom list: into the preferences, or into the
// shared view, which stays a shared view
function storeShownList(maps) {
	const prefs = sharedMapView || getMapPrefs();
	prefs.preset = 'custom';
	prefs.maps = maps;
	if (!sharedMapView) saveMapPrefs(prefs);
}

// a map taken off the board leaves the list it is shown from
/** @param {string} mapId */
export function removeMapFromList(mapId) {
	storeShownList(resolveMapIds().filter(id => id !== mapId));
	arrangementChanged();
}

// the tab's [+]: the map goes on the end of the list. The arrangement is
// written by the caller, once the widget stands on the board
/** @param {string} mapId */
export function addMapToList(mapId) {
	storeShownList(resolveMapIds().filter(id => id !== mapId).concat(mapId));
}

// the list a preferences object names, deduped as well as filtered: a
// hand-crafted ?v= can name a map twice, and two renderings of it would share
// one data-slideshow-id
/** @param {MapPrefs} prefs @returns {string[]} */
export function prefsMapIds(prefs) {
	if (prefs.preset === 'custom' && Array.isArray(prefs.maps))
		return [...new Set(prefs.maps)].filter(id => CATALOG_BY_ID.has(id));
	return presetMapIds(prefs.preset) || presetMapIds('zadano');
}

// same maps in the same order: the render order is part of what a preset is,
// so a reordered copy is a different view and stays "Prilagođeno"
/** @param {string[]} a @param {string[]} b @returns {boolean} */
export function sameMapIds(a, b) {
	return a.length === b.length && a.every((id, index) => id === b[index]);
}

// the preset a shared list is, matched on contents and order, saved presets
// first (INTERNALS.md, Share links)
/** @param {string[]} mapIds @returns {string | null} */
export function presetIdForMapIds(mapIds) {
	const match = getUserPresets().concat(MAP_PRESETS).find(preset => sameMapIds(preset.maps, mapIds));
	return match ? match.id : null;
}

let sharedMapView = null;

// the view a shared link opened, null when there is none
/** @returns {MapPrefs | null} */
export function getSharedMapView() {
	return sharedMapView;
}

// read once, as the page starts, from the address it was opened at
export function loadSharedMapView() {
	const value = new URLSearchParams(window.location.search).get('v');
	sharedMapView = value ? decodeMapView(value) : null;
}

/** @returns {MapPrefs} */
export function getActiveMapPrefs() {
	return sharedMapView || getMapPrefs();
}

// the page hidden from <head> until a board's arrangement is applied, so a
// slow load does not show the ordinary page first (INTERNALS.md, The board)
export function cloakBoard() {
	const layout = getActiveMapPrefs().layout;
	if (layout && layout.dashboard && DESKTOP_MQ.matches) document.documentElement.classList.add('board-boot');
}

// and off again once the arrangement is applied — or failed to be: a step of
// its own, so a throw in the apply cannot leave the page hidden behind a board
// that never arrived
export function uncloakBoard() {
	document.documentElement.classList.remove('board-boot');
}

// which chip the panel opens on. Only a shared list is matched back to a
// preset (INTERNALS.md, Share links)
/** @returns {string} */
export function activePresetId() {
	const prefs = getActiveMapPrefs();
	if (sharedMapView && prefs.preset === 'custom') return presetIdForMapIds(resolveMapIds()) || 'custom';
	return prefs.preset;
}

export function clearSharedMapView() {
	if (!sharedMapView) return;
	sharedMapView = null;
	const url = new URL(window.location.href);
	url.searchParams.delete('v');
	history.replaceState(null, '', url);
}

// the arrangement, next to the map list it belongs to: into the preferences,
// or into the shared view and its address (INTERNALS.md, Remembered and shared
// layouts)
/** @param {import('../widgets/layout.js').SnapLayout | null} layout */
export function storeViewLayout(layout) {
	if (sharedMapView) {
		if (layout) sharedMapView.layout = layout;
		else delete sharedMapView.layout;
		const url = new URL(window.location.href);
		url.searchParams.set('v', encodeMapView(sharedMapView));
		history.replaceState(null, '', url);
	} else {
		const prefs = getMapPrefs();
		if (layout) prefs.layout = layout;
		else delete prefs.layout;
		saveMapPrefs(prefs);
	}
}
