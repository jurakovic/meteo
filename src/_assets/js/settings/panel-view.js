// What the settings dialog would apply or share, worked out from what it holds
// — the preset or list picked, the board's tick — and the arrangement on
// screen. No DOM here: the dialog's sections pass in what they show.

import { prefsMapIds, sameMapIds } from '../maps/prefs.js';
import { getUserPresets, isUserPresetId } from '../maps/presets.js';
import { presetSharePrefs } from '../maps/share.js';
import { currentSnapLayout, sameSnapLayout, sanitizeSnapLayout } from '../widgets/layout.js';

// the preferences the picked preset (or custom list) stands for
export function readPanelPrefs(presetId, mapIds) {
	if (presetId === 'custom') return { preset: 'custom', maps: mapIds };
	return { preset: presetId };
}

// the mode is the panel's, not the arrangement's: whatever layout is going to
// be applied, the toggle decides whether it is a board. Ticked, it turns any
// layout into one — a built-in's nothing included, which applySnapLayout then
// fills with every map of the list. Unticked, a board loses its placements
// along with the flag: a board holds the whole list as widgets, and over the
// visible page that is a pile rather than an arrangement.
// It runs before sanitizeSnapLayout rather than after, so what it marks a
// board is held to what a board can hold — no columns — by the same guard
// every layout read back from storage or a link passes
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
export function layoutForPrefs(prefs, dashboardChecked, current = currentSnapLayout()) {
	const stored = prefs.preset === 'custom'
		? current
		: (getUserPresets().find(p => p.id === prefs.preset) || {}).layout; // a built-in has none
	return sanitizeSnapLayout(withDashboard(stored, dashboardChecked), prefsMapIds(prefs));
}

// the arrangement on screen, held to the list in the picker (a map unchecked
// there cannot stay a pane) and to the mode in the row, so what a preset
// saves and what Ažuriraj counts as an edit are the view Primijeni would build
export function selectedLayout(mapIds, dashboardChecked, current = currentSnapLayout()) {
	return sanitizeSnapLayout(withDashboard(current, dashboardChecked), mapIds);
}

// the panel's own share button carries whatever is on screen, expanding a
// saved preset the same way the per-preset links do — with the panel's mode
// on it either way, since the link carries the view Primijeni would build
export function readSharePrefs(prefs, dashboardChecked, current = currentSnapLayout()) {
	const layout = layoutForPrefs(prefs, dashboardChecked, current);
	const preset = getUserPresets().find(p => p.id === prefs.preset);
	const shared = preset ? presetSharePrefs(preset) : prefs;
	if (layout) shared.layout = layout; else delete shared.layout;
	return shared;
}

// what is snapped or floating, for the layout line
export function layoutParts(layout) {
	const parts = [];
	if (!layout) return parts;
	if (layout.left) parts.push(`lijevo ${layout.left.panes.length}`);
	if (layout.right) parts.push(`desno ${layout.right.panes.length}`);
	if (layout.floating) parts.push(`u prozoru ${layout.floating.length}`);
	return parts;
}

// only the preset the list came from: any other row would take an overwrite
// with a list that has nothing to do with it. Saving under the same name in
// the add form still works and is unchanged — this is the same write, minus
// having to know that the name is the handle. The saved-preset guard is not
// redundant: editingPresetId also holds built-in ids (they carry the origin
// dot), and a built-in reaching storeUserPreset would fork a saved copy of
// itself under its own name rather than update anything.
// The arrangement counts as an edit too — it is part of what the preset
// stores — but only here: the origin dot on the chip marks a changed list,
// which is what the panel itself edits, and a rearranged page still shows
// the preset's maps.
export function hasPendingEdits(preset, editingPresetId, mapIds, layout) {
	return isUserPresetId(preset.id) && preset.id === editingPresetId
		&& (!sameMapIds(preset.maps, mapIds) || !sameSnapLayout(preset.layout, layout));
}
