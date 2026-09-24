import { isValidPrefs } from './prefs.js';
import { cleanPresetName } from './presets.js';

// A shared link overrides the saved preferences for the session only; the
// parameter is kept in the address bar (re-copyable, refresh-safe) and is
// removed once the user applies their own settings.

// btoa only takes code points up to U+00FF, and a saved preset's name rides
// along in the payload — every Croatian diacritic (č ć š ž đ) is above that.
// Escaping them as \uXXXX first keeps the input ASCII; JSON.parse reads those
// back on its own, so decodeMapView needs no counterpart and links shared by
// an older version (ASCII throughout) still decode unchanged.
/** @param {import('./prefs.js').MapPrefs} prefs @returns {string} */
export function encodeMapView(prefs) {
	const json = JSON.stringify(prefs)
		.replace(/[\u0080-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
	return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** @param {string} value the ?v= parameter @returns {import('./prefs.js').MapPrefs | null} */
export function decodeMapView(value) {
	try {
		const prefs = JSON.parse(atob(value.replace(/-/g, '+').replace(/_/g, '/')));
		if (isValidPrefs(prefs)) {
			// a shared saved preset travels as its contents plus its name, which
			// the panel offers to save — it lands in storage, so bound it here
			if (prefs.name) prefs.name = cleanPresetName(prefs.name);
			return prefs;
		}
	} catch { /* malformed parameter falls through */ }
	return null;
}

// a saved preset's id means nothing to a recipient, so it travels as its
// contents plus its name — the name is only a label to save it under
/** @param {import('./presets.js').Preset} preset @returns {import('./prefs.js').MapPrefs} */
export function presetSharePrefs(preset) {
	const prefs = { preset: 'custom', maps: preset.maps.slice(), name: preset.name };
	if (preset.layout) prefs.layout = preset.layout;
	return prefs;
}

// navigator.clipboard only exists in secure contexts (https/localhost), e.g.
// not on http://<LAN-IP>; fall back to a copyable prompt there — and again if
// the write itself is refused (permissions, lost focus)
/** @param {import('./prefs.js').MapPrefs} prefs @param {() => void} onCopied */
export function copyMapViewLink(prefs, onCopied) {
	const url = new URL(window.location.origin + window.location.pathname);
	url.searchParams.set('v', encodeMapView(prefs));
	const link = url.toString();
	const promptCopy = () => window.prompt('Kopiraj poveznicu:', link);
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(link).then(onCopied).catch(promptCopy);
	} else {
		promptCopy();
	}
}
