// What this browser remembers: every key the site stores, and reads and
// writes that never throw. See INTERNALS.md, Storage.

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

// the value stored under key, parsed; null when there is none or it is not JSON
/** @param {string} key one of STORAGE_KEYS @returns {any} */
export function readJson(key) {
	try {
		return JSON.parse(unsaved.has(key) ? unsaved.get(key) : localStorage.getItem(key));
	} catch {
		return null;
	}
}

// kept for the session when the browser refuses to store it
/** @param {string} key one of STORAGE_KEYS @param {unknown} value */
export function writeJson(key, value) {
	const json = JSON.stringify(value);
	try {
		localStorage.setItem(key, json);
		unsaved.delete(key);
	} catch {
		unsaved.set(key, json);
	}
}

/** @param {string} key one of STORAGE_KEYS */
export function removeKey(key) {
	unsaved.delete(key);
	try {
		localStorage.removeItem(key);
	} catch { /* nothing stored is nothing to drop */ }
}
