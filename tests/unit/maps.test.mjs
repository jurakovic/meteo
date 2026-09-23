// The customize page's data: finding, the view's preferences, share links,
// instance keys
import './setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogMap, MAP_CATALOG } from '../../src/_assets/js/maps/catalog.js';
import { findTerms, foldText, matchesFind } from '../../src/_assets/js/maps/find.js';
import { isValidPrefs, prefsMapIds, presetIdForMapIds, sameMapIds } from '../../src/_assets/js/maps/prefs.js';
import { cleanPresetName, DEFAULT_MAPS, MAP_PRESETS, uniquePresetName, storeUserPreset } from '../../src/_assets/js/maps/presets.js';
import { instIndex, instKey, instMapId, instSuffix } from '../../src/_assets/js/maps/render.js';
import { decodeMapView, encodeMapView } from '../../src/_assets/js/maps/share.js';

test('the catalog: unique ids, every one found by catalogMap', () => {
	const ids = MAP_CATALOG.map(map => map.id);
	assert.equal(new Set(ids).size, ids.length);
	for (const id of ids) assert.equal(catalogMap(id).id, id);
	assert.equal(catalogMap('nope'), null);
});

test('every preset names only maps in the catalog', () => {
	for (const preset of MAP_PRESETS) {
		for (const id of preset.maps) assert.ok(catalogMap(id), `${preset.id}: ${id}`);
	}
});

test('find folds case and diacritics, đ included, and every term must hit', () => {
	assert.equal(foldText('ČHMÚ Đakovo'), 'chmu dakovo');
	assert.deepEqual(findTerms('  Neverin   RADAR '), ['neverin', 'radar']);
	const map = catalogMap('neverin-radar-hr');
	assert.ok(matchesFind(map, findTerms('neverin radar')));
	assert.ok(matchesFind(map, findTerms('radar'))); // the category as well as the name
	assert.ok(!matchesFind(map, findTerms('neverin satelit')));
});

test('preferences: a real preset or custom; custom lists deduped and held to the catalog', () => {
	assert.ok(isValidPrefs({ preset: 'radari' }));
	assert.ok(isValidPrefs({ preset: 'custom', maps: [] }));
	assert.ok(!isValidPrefs({ preset: 'gone' }));
	assert.ok(!isValidPrefs(null));
	assert.deepEqual(prefsMapIds({ preset: 'custom', maps: ['windy', 'nope', 'windy', 'essl'] }), ['windy', 'essl']);
	assert.deepEqual(prefsMapIds({ preset: 'zadano' }), DEFAULT_MAPS);
	assert.deepEqual(prefsMapIds({ preset: 'unknown' }), DEFAULT_MAPS);
});

test('a list is matched back to its preset by contents and order', () => {
	assert.ok(sameMapIds(['a', 'b'], ['a', 'b']));
	assert.ok(!sameMapIds(['a', 'b'], ['b', 'a']));
	assert.equal(presetIdForMapIds(DEFAULT_MAPS), 'zadano');
	assert.equal(presetIdForMapIds([...DEFAULT_MAPS].reverse()), null);
});

test('share links round-trip, diacritics included, and junk decodes to nothing', () => {
	const prefs = { preset: 'custom', maps: ['windy', 'essl'], name: 'Čista šuma', layout: { dashboard: true } };
	const value = encodeMapView(prefs);
	assert.match(value, /^[A-Za-z0-9_-]+$/); // safe in an address, no padding
	assert.deepEqual(decodeMapView(value), prefs);
	assert.equal(decodeMapView('not base64!'), null);
	assert.equal(decodeMapView(encodeMapView({ preset: 'gone' })), null);
	// a shared name is bounded on the way in, since it may be saved
	assert.equal(decodeMapView(encodeMapView({ preset: 'custom', maps: [], name: 'x'.repeat(100) })).name.length, 40);
});

test('preset names: cleaned, and made unique within the budget', () => {
	assert.equal(cleanPresetName('  Moji   radari  '), 'Moji radari');
	storeUserPreset('Radari HR', ['windy']);
	assert.equal(uniquePresetName('Radari HR'), 'Radari HR (2)');
	const long = 'y'.repeat(40);
	storeUserPreset(long, ['windy']);
	const unique = uniquePresetName(long);
	assert.equal(unique.length, 40);
	assert.ok(unique.endsWith(' (2)'));
});

test('instance keys: the plain id for the first showing, #n for copies', () => {
	assert.equal(instKey('windy', 1), 'windy');
	assert.equal(instKey('windy', 3), 'windy#3');
	assert.equal(instMapId('windy#3'), 'windy');
	assert.equal(instIndex('windy#3'), 3);
	assert.equal(instIndex('windy'), 1);
	assert.equal(instSuffix('windy#2'), 'Copy2');
	assert.equal(instSuffix('windy'), '');
});
