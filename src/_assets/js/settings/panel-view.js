// What the settings dialog would apply or share, worked out from what it holds
// — the preset or list picked, the board's tick — and the arrangement on
// screen. No DOM here: the dialog's sections pass in what they show.

import { prefsMapIds, sameMapIds } from '../maps/prefs.js';
import { getUserPresets, isUserPresetId } from '../maps/presets.js';
import { presetSharePrefs } from '../maps/share.js';
import { currentSnapLayout, sameSnapLayout, sanitizeSnapLayout } from '../widgets/layout.js';

// the preferences the picked preset (or custom list) stands for
/** @param {string} presetId @param {string[]} mapIds */
export function readPanelPrefs(presetId, mapIds) {
	if (presetId === 'custom') return { preset: 'custom', maps: mapIds };
	return { preset: presetId };
}

// The toggle, not the layout, decides whether the view is a board. Ticked, any
// layout becomes one (an empty one is filled by applySnapLayout). Unticked, a
// board's placements go with the flag: over the page they would be a pile.
// Called before sanitizeSnapLayout, which then holds a board to what a board
// can hold (no columns)
/** @param {import('../widgets/layout.js').SnapLayout | null} layout @param {boolean} on */
export function withDashboard(layout, on) {
	if (!on) return layout && layout.dashboard ? null : layout;
	const board = Object.assign({}, layout);
	board.dashboard = true;
	return board;
}

// the arrangement to go with a prefs object. A preset is a whole view:
// applying a saved one brings its own arrangement (none, if it was saved
// with nothing popped out), and a built-in has none, so everything docks.
// Only the custom list keeps what is on screen, as far as its maps allow —
// that is an edit of the current view, not a switch to another one
/** @param {import('../maps/prefs.js').MapPrefs} prefs @param {boolean} dashboardChecked @param {import('../widgets/layout.js').SnapLayout | null} [current] */
export function layoutForPrefs(prefs, dashboardChecked, current = currentSnapLayout()) {
	const stored = prefs.preset === 'custom'
		? current
		: (getUserPresets().find(p => p.id === prefs.preset) || {}).layout; // a built-in has none
	return sanitizeSnapLayout(withDashboard(stored, dashboardChecked), prefsMapIds(prefs));
}

// the arrangement on screen, held to the list in the picker (a map unchecked
// there cannot stay a pane) and to the mode in the row, so what a preset
// saves and what Ažuriraj counts as an edit are the view Primijeni would build
/** @param {string[]} mapIds @param {boolean} dashboardChecked @param {import('../widgets/layout.js').SnapLayout | null} [current] */
export function selectedLayout(mapIds, dashboardChecked, current = currentSnapLayout()) {
	return sanitizeSnapLayout(withDashboard(current, dashboardChecked), mapIds);
}

// the panel's own share button carries whatever is on screen, expanding a
// saved preset the same way the per-preset links do — with the panel's mode
// on it either way, since the link carries the view Primijeni would build
/** @param {import('../maps/prefs.js').MapPrefs} prefs @param {boolean} dashboardChecked @param {import('../widgets/layout.js').SnapLayout | null} [current] */
export function readSharePrefs(prefs, dashboardChecked, current = currentSnapLayout()) {
	const layout = layoutForPrefs(prefs, dashboardChecked, current);
	const preset = getUserPresets().find(p => p.id === prefs.preset);
	const shared = preset ? presetSharePrefs(preset) : prefs;
	if (layout) shared.layout = layout; else delete shared.layout;
	return shared;
}

// what is snapped or floating, for the layout line
/** @param {import('../widgets/layout.js').SnapLayout | null} layout */
export function layoutParts(layout) {
	const parts = [];
	if (!layout) return parts;
	if (layout.left) parts.push(`lijevo ${layout.left.panes.length}`);
	if (layout.right) parts.push(`desno ${layout.right.panes.length}`);
	if (layout.floating) parts.push(`u prozoru ${layout.floating.length}`);
	return parts;
}

// Whether a saved preset's row offers Ažuriraj: only for the preset the list
// came from, and only a saved one (editingPresetId can be a built-in's, which
// storeUserPreset would fork rather than update). The arrangement counts as an
// edit here, being part of what the preset stores; the chip's origin dot
// marks list changes only.
/** @param {import('../maps/presets.js').Preset} preset @param {string} editingPresetId @param {string[]} mapIds @param {import('../widgets/layout.js').SnapLayout | null} layout */
export function hasPendingEdits(preset, editingPresetId, mapIds, layout) {
	return isUserPresetId(preset.id) && preset.id === editingPresetId
		&& (!sameMapIds(preset.maps, mapIds) || !sameSnapLayout(preset.layout, layout));
}
