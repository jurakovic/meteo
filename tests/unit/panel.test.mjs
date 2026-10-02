// What the settings dialog would apply or share
import './setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storeUserPreset } from '../../src/_assets/js/maps/presets.js';
import { hasPendingEdits, layoutForPrefs, layoutParts, readPanelPrefs, readSharePrefs, selectedLayout, withDashboard } from '../../src/_assets/js/settings/panel-view.js';

const floating = { floating: [{ id: 'windy', left: 0.1, top: 0.1, width: 0.3 }] };

test('the picked preset or custom list as preferences', () => {
	assert.deepEqual(readPanelPrefs('radari', ['x']), { preset: 'radari' });
	assert.deepEqual(readPanelPrefs('custom', ['windy']), { preset: 'custom', maps: ['windy'] });
});

test('the board tick makes any layout a board, and unticked a board is dropped', () => {
	assert.deepEqual(withDashboard(null, true), { dashboard: true });
	assert.deepEqual(withDashboard(floating, true), { ...floating, dashboard: true });
	assert.equal(withDashboard({ dashboard: true, floating: [] }, false), null);
	assert.equal(withDashboard(floating, false), floating);
});

test('a custom list keeps what is on screen; a built-in brings none', () => {
	assert.deepEqual(layoutForPrefs({ preset: 'custom', maps: ['windy'] }, false, floating), floating);
	assert.equal(layoutForPrefs({ preset: 'custom', maps: ['essl'] }, false, floating), null); // windy is not in the list
	assert.equal(layoutForPrefs({ preset: 'radari' }, false, floating), null);
	assert.deepEqual(layoutForPrefs({ preset: 'radari' }, true, floating), { dashboard: true });
	assert.deepEqual(selectedLayout(['windy'], false, floating), floating);
});

test('a saved preset brings its own layout, and shares as its contents', () => {
	const preset = storeUserPreset('Ploča', ['windy', 'essl'], { dashboard: true });
	assert.deepEqual(layoutForPrefs({ preset: preset.id }, true, floating), { dashboard: true });
	assert.deepEqual(readSharePrefs({ preset: preset.id }, true, floating), { preset: 'custom', maps: ['windy', 'essl'], name: 'Ploča', layout: { dashboard: true } });
	// the edit is pending only on the preset the list came from
	assert.ok(hasPendingEdits(preset, preset.id, ['windy'], { dashboard: true }));
	assert.ok(hasPendingEdits(preset, preset.id, ['windy', 'essl'], null));
	assert.ok(!hasPendingEdits(preset, preset.id, ['windy', 'essl'], { dashboard: true }));
	assert.ok(!hasPendingEdits(preset, 'radari', ['windy'], null));
});

test('the layout line names what is out', () => {
	assert.deepEqual(layoutParts(null), []);
	assert.deepEqual(layoutParts({ left: { panes: [1, 2] }, floating: [1] }), ['lijevo 2', 'u prozoru 1']);
});
