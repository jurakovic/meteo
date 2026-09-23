// What this browser remembers, in one place: every key the site stores, and
// reading and writing that never throw. Storage can be disabled (a private
// window), full, or hold something another version wrote, and none of that is
// a reason for the page to break — a read that fails is nothing stored, and a
// write that fails is remembered for this session. Values are JSON; what one
// holds is checked by the module that reads it.
//
// The view (a preset or a list, and its arrangement) travels in presets and
// share links too; everything else here is this browser's alone: how this
// screen is worked, not what it shows.

export const STORAGE_KEYS = {
	mapPrefs: 'mapPrefs', // the view: a preset or a custom list, with its arrangement (maps/prefs.js)
	userPresets: 'mapUserPresets', // the presets the user saved (maps/presets.js)
	hiddenPresets: 'mapHiddenPresets', // the built-ins taken off the preset bar (maps/presets.js)
	mapConfig: 'mapConfig', // the last copy of the worker's config.json (remote-config.js)
	grid: 'mapGrid', // the board's grid switches (widgets/grid.js)
	refresh: 'mapRefresh', // auto-refresh (widgets/refresh.js)
	tab: 'msTab', // where the tab was dragged, how wide (settings/tab.js)
	linksBottom: 'showLinksBottom' // the links under each map (page/links.js)
	// and a dialog's place and size under the key its element names in
	// data-dialog-key: msPanel, manualPanel (page/dialog.js)
};

// what could not be written, kept for the rest of the session: storage
// refused or full, the page still reads back what it was told, rather than
// whatever the storage held before (or nothing)
const unsaved = new Map();

export function readJson(key) {
	try {
		return JSON.parse(unsaved.has(key) ? unsaved.get(key) : localStorage.getItem(key));
	} catch {
		return null;
	}
}

export function writeJson(key, value) {
	const json = JSON.stringify(value);
	try {
		localStorage.setItem(key, json);
		unsaved.delete(key);
	} catch {
		unsaved.set(key, json);
	}
}

export function removeKey(key) {
	unsaved.delete(key);
	try {
		localStorage.removeItem(key);
	} catch { /* nothing stored is nothing to drop */ }
}
