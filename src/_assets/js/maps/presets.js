// The presets: the built-in views, the ones the user saved, and which
// built-ins the user hid from the preset bar.

import { readJson, STORAGE_KEYS, writeJson } from '../lib/storage.js';
import { DEFAULT_MAPS, MAP_CATALOG } from './catalog.js';
import { getMapPrefs, saveMapPrefs } from './prefs.js';

// every preset carries its own id list, so resolving one is a plain lookup
export const MAP_PRESETS = [
	// the id stays 'zadano': it is written into saved preferences and shared links
	{ id: 'zadano', name: 'Osnovno', maps: DEFAULT_MAPS },
	{
		id: 'vise', name: 'Više',
		maps: [
			'ventusky', 'rainviewer', 'weatherandradar', 'meteo-si', 'idokep-radar-eu',
			'idokep-satelit-eu', 'istramet-munje', 'blitzortung-karta', 'wetterzentrale-temp',
			'dhmz-sinopticka', 'chmi-sinopticka', 'dhmz-puntijarka', 'dhmz-bilogora', 'dhmz-gradiste', 'dhmz-goli',
			'dhmz-debeljak', 'dhmz-uljenje'
		]
	},
	{
		id: 'radari', name: 'Radari',
		maps: ['neverin-radar-hr', 'neverin-radar-eu', 'windy', 'dhmz-radar', 'eumetnet', 'ventusky', 'rainviewer', 'weatherandradar', 'meteo-si', 'idokep-radar-eu']
	},
	{
		id: 'sateliti', name: 'Sateliti',
		maps: ['neverin-satelit-hr', 'neverin-satelit-eu', 'meteociel-satelit', 'idokep-satelit-eu']
	},
	{
		id: 'nevrijeme', name: 'Nevrijeme',
		maps: ['essl', 'astorp', 'estofex', 'blitzortung', 'istramet-munje', 'blitzortung-karta']
	},
	{ id: 'sve', name: 'Sve', maps: MAP_CATALOG.map(map => map.id) },
	{ id: 'nista', name: 'Ništa', maps: [] }
];

// Saved presets take the built-ins' shape, their ids prefixed out of the
// built-ins' namespace (INTERNALS.md, Saved presets).

const USER_PRESET_PREFIX = 'u:';

export const PRESET_NAME_MAX = 40;

/**
 * @typedef {object} Preset
 * @property {string} id a built-in's name-like id, or 'u:' and a random one for a saved preset
 * @property {string} name
 * @property {string[]} maps in render order
 * @property {import('../widgets/layout.js').SnapLayout | null} [layout] a saved preset's arrangement
 */

/** @param {string} id @returns {boolean} */
export function isUserPresetId(id) {
	return typeof id === 'string' && id.startsWith(USER_PRESET_PREFIX);
}

// a saved preset that is a board: its layout carries the mode (widgets/board.js)
/** @param {{ id: string, layout?: import('../widgets/layout.js').SnapLayout | null }} preset @returns {boolean} */
export function isBoardPreset(preset) {
	return !!(preset && preset.layout && preset.layout.dashboard === true);
}

function isValidPreset(preset) {
	return preset && isUserPresetId(preset.id)
		&& typeof preset.name === 'string' && Array.isArray(preset.maps);
}

function loadUserPresets() {
	const list = readJson(STORAGE_KEYS.userPresets);
	return Array.isArray(list) ? list.filter(isValidPreset) : [];
}

// read once: allPresets runs on every validation and panel build
let userPresets = loadUserPresets();

// the saved presets, in the order they were made
/** @returns {Preset[]} */
export function getUserPresets() {
	return userPresets;
}

function saveUserPresets() {
	writeJson(STORAGE_KEYS.userPresets, userPresets);
}

/** @returns {Preset[]} */
export function allPresets() {
	return MAP_PRESETS.concat(userPresets);
}

function newPresetId() {
	let id;
	do { id = USER_PRESET_PREFIX + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
	while (userPresets.some(preset => preset.id === id));
	return id;
}

// the name is the handle for overwriting, so it has to stay printable and bounded
/** @param {string} name @returns {string} */
export function cleanPresetName(name) {
	return String(name).trim().replace(/\s+/g, ' ').slice(0, PRESET_NAME_MAX);
}

/** @param {string} name @returns {Preset | undefined} */
export function findUserPresetByName(name) {
	return userPresets.find(preset => preset.name.toLowerCase() === name.toLowerCase());
}

// saving under an existing name updates that preset. The layout (null for
// none) is saved with it: a preset is the whole view
/**
 * @param {string} name @param {string[]} maps
 * @param {import('../widgets/layout.js').SnapLayout | null} [layout]
 * @returns {Preset}
 */
export function storeUserPreset(name, maps, layout = null) {
	const existing = findUserPresetByName(name);
	if (existing) {
		existing.name = name;
		existing.maps = maps;
		existing.layout = layout;
	} else {
		userPresets.push({ id: newPresetId(), name: name, maps: maps, layout: layout });
	}
	saveUserPresets();
	return existing || userPresets[userPresets.length - 1];
}

// a saved preset under a new name: false, and nothing written, when the
// name is empty or another preset already holds it
/** @param {string} id @param {string} name @returns {boolean} */
export function renameUserPreset(id, name) {
	const preset = userPresets.find(p => p.id === id);
	const clean = cleanPresetName(name);
	const clash = findUserPresetByName(clean);
	if (!preset || !clean || (clash && clash !== preset)) return false;
	preset.name = clean;
	saveUserPresets();
	return true;
}

// for a preset arriving from someone else's link, where silently overwriting a
// preset of the recipient's own would lose their list
/** @param {string} name @returns {string} */
export function uniquePresetName(name) {
	// the budget is spent before the clash is looked up, not after: appending
	// the suffix and slicing back to PRESET_NAME_MAX would hand a full-length
	// name straight back to storeUserPreset, which overwrites by name
	const base = cleanPresetName(name);
	let candidate = base;
	for (let n = 2; findUserPresetByName(candidate); n++) {
		const suffix = ` (${n})`;
		candidate = base.slice(0, PRESET_NAME_MAX - suffix.length).trim() + suffix;
	}
	return candidate;
}

// deleting writes at once, so a mapPrefs naming the preset becomes a custom
// copy of its stored maps, not of the panel's list (INTERNALS.md, Saved presets)
/** @param {string} id */
export function deleteUserPreset(id) {
	const preset = userPresets.find(p => p.id === id);
	if (preset && getMapPrefs().preset === id)
		saveMapPrefs({ preset: 'custom', maps: preset.maps.slice(), layout: getMapPrefs().layout });
	userPresets = userPresets.filter(p => p.id !== id);
	saveUserPresets();
}

// Built-ins are hidden rather than deleted, and only the preset bar filters
// them (INTERNALS.md, Saved presets).

// one built-in always stays on offer, so the row can never come down to
// "Prilagođeno" alone and there is always a named view to get back to
const PERMANENT_PRESET_ID = 'zadano';

/** @param {string} id @returns {boolean} */
export function isHideablePreset(id) {
	return id !== PERMANENT_PRESET_ID;
}

function loadHiddenPresets() {
	const list = readJson(STORAGE_KEYS.hiddenPresets);
	// the permanent one is dropped on the way in, so a list stored before it
	// became permanent doesn't keep it hidden or skew the counts below
	return Array.isArray(list) ? list.filter(id => isHideablePreset(id) && MAP_PRESETS.some(preset => preset.id === id)) : [];
}

let hiddenPresets = loadHiddenPresets();

// the ids of the built-ins taken off the preset bar
/** @returns {string[]} */
export function getHiddenPresets() {
	return hiddenPresets;
}

function saveHiddenPresets() {
	writeJson(STORAGE_KEYS.hiddenPresets, hiddenPresets);
}

/** @param {string} id @returns {boolean} */
export function isPresetHidden(id) {
	return hiddenPresets.includes(id);
}

/** @param {string} id @param {boolean} hidden */
export function setPresetHidden(id, hidden) {
	if (hidden && !isHideablePreset(id)) return; // no row offers this, but the rule lives here
	hiddenPresets = hiddenPresets.filter(hiddenId => hiddenId !== id);
	if (hidden) hiddenPresets.push(id);
	saveHiddenPresets();
}

/** @returns {Preset[]} */
export function hideablePresets() {
	return MAP_PRESETS.filter(preset => isHideablePreset(preset.id));
}

export function hideAllPresets() {
	hiddenPresets = hideablePresets().map(preset => preset.id);
	saveHiddenPresets();
}

export function showAllPresets() {
	hiddenPresets = [];
	saveHiddenPresets();
}

// what the preset bar offers, as opposed to what still resolves
/** @returns {Preset[]} */
export function visiblePresets() {
	return allPresets().filter(preset => !isPresetHidden(preset.id));
}
