// The presets: the built-in views, the ones the user saved, and which
// built-ins the user hid from the preset bar.

import { MAP_CATALOG } from './catalog.js';
import { getMapPrefs, saveMapPrefs } from './prefs.js';

// default view of the customize page (mirrors the static landing page)
export const DEFAULT_MAPS = [
	'neverin-radar-hr', 'neverin-satelit-hr', 'neverin-radar-eu', 'neverin-satelit-eu',
	'windy', 'dhmz-radar', 'meteociel-temp', 'blitzortung', 'essl', 'astorp', 'estofex',
	'eumetnet', 'meteociel-satelit', 'dwd-sinopticka', 'neverin-kamera', 'meteoblue-prognoza'
];

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

// Saved views take the same { id, name, maps } shape as the built-ins, so the
// preset bar, presetMapIds and the stored preferences treat both alike. Ids
// are prefixed to keep them out of the built-in namespace, which leaves the
// name free to change — renaming never breaks a saved preference or selection.

const USER_PRESETS_KEY = 'mapUserPresets';

const USER_PRESET_PREFIX = 'u:';

export const PRESET_NAME_MAX = 40;

export function isUserPresetId(id) {
	return typeof id === 'string' && id.startsWith(USER_PRESET_PREFIX);
}

// a saved preset that is a board: its layout carries the mode (widgets/board.js)
export function isBoardPreset(preset) {
	return !!(preset && preset.layout && preset.layout.dashboard === true);
}

function isValidPreset(preset) {
	return preset && isUserPresetId(preset.id)
		&& typeof preset.name === 'string' && Array.isArray(preset.maps);
}

function loadUserPresets() {
	try {
		const list = JSON.parse(localStorage.getItem(USER_PRESETS_KEY));
		if (Array.isArray(list)) return list.filter(isValidPreset);
	} catch { /* corrupt storage falls through to none */ }
	return [];
}

// read once: allPresets runs on every validation and panel build
export let userPresets = loadUserPresets();

export function saveUserPresets() {
	try {
		localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(userPresets));
	} catch { /* storage disabled or full — the presets still work this session */ }
}

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
export function cleanPresetName(name) {
	return String(name).trim().replace(/\s+/g, ' ').slice(0, PRESET_NAME_MAX);
}

export function findUserPresetByName(name) {
	return userPresets.find(preset => preset.name.toLowerCase() === name.toLowerCase());
}

// saving under an existing name updates that preset — the way to amend a saved
// view is to edit the list and save it again under the same name. The layout
// (the snapped arrangement, null for none) is part of what is saved: a preset
// is the whole view, and applying it brings the arrangement back
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

// for a preset arriving from someone else's link, where silently overwriting a
// preset of the recipient's own would lose their list
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

// deleting writes to storage at once, unlike the rest of the panel, which only
// commits on Primijeni — so a saved preference naming this preset has to be
// rewritten in the same breath. Left alone it would fail isValidPrefs on the
// next load and fall back to Osnovno, losing the view still on screen. The
// stored contents are what gets kept, not the panel's possibly-edited list.
export function deleteUserPreset(id) {
	const preset = userPresets.find(p => p.id === id);
	if (preset && getMapPrefs().preset === id)
		saveMapPrefs({ preset: 'custom', maps: preset.maps.slice(), layout: getMapPrefs().layout });
	userPresets = userPresets.filter(p => p.id !== id);
	saveUserPresets();
}

// Built-ins are code, so they are hidden rather than deleted — and hiding is a
// display choice only. allPresets keeps returning them, so a saved preference,
// the zadano fallback and a shared link naming a preset the recipient hides
// all keep resolving. Only the preset bar filters.

const HIDDEN_PRESETS_KEY = 'mapHiddenPresets';

// one built-in always stays on offer, so the row can never come down to
// "Prilagođeno" alone and there is always a named view to get back to
const PERMANENT_PRESET_ID = 'zadano';

export function isHideablePreset(id) {
	return id !== PERMANENT_PRESET_ID;
}

function loadHiddenPresets() {
	try {
		const list = JSON.parse(localStorage.getItem(HIDDEN_PRESETS_KEY));
		// the permanent one is dropped on the way in, so a list stored before it
		// became permanent doesn't keep it hidden or skew the counts below
		if (Array.isArray(list)) return list.filter(id => isHideablePreset(id) && MAP_PRESETS.some(preset => preset.id === id));
	} catch { /* corrupt storage falls through to none hidden */ }
	return [];
}

export let hiddenPresets = loadHiddenPresets();

function saveHiddenPresets() {
	try {
		localStorage.setItem(HIDDEN_PRESETS_KEY, JSON.stringify(hiddenPresets));
	} catch { /* storage disabled or full — the choice still holds this session */ }
}

export function isPresetHidden(id) {
	return hiddenPresets.includes(id);
}

export function setPresetHidden(id, hidden) {
	if (hidden && !isHideablePreset(id)) return; // no row offers this, but the rule lives here
	hiddenPresets = hiddenPresets.filter(hiddenId => hiddenId !== id);
	if (hidden) hiddenPresets.push(id);
	saveHiddenPresets();
}

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
export function visiblePresets() {
	return allPresets().filter(preset => !isPresetHidden(preset.id));
}
