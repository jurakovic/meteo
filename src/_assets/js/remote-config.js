// Which maps are switched off, from a file beside the maps' own sources, so a
// map whose source is down can be taken off both pages without a build. It is
// read from the last copy this browser saw, at once, and fetched again behind
// that for the next load — or for this one, if it changed. A map the file does
// not name is on, and so is every map when there is no copy yet or the fetch
// fails: a broken file hides nothing.
//
// Started first on both pages, since the render asks isMapEnabled(): both
// leave a map that is off out of what they draw, and draw again on a change
// (map-config-changed)

import { emit, EVENTS } from './lib/events.js';
import { readJson, STORAGE_KEYS, writeJson } from './lib/storage.js';

const MAP_CONFIG_URL = 'https://meteo-data.jurakovic.workers.dev/config.json';

// { "maps": { "<id>": { "enabled": false } } } — anything else is ignored
function disabledMapIds(config) {
	const maps = config && config.maps && typeof config.maps === 'object' ? config.maps : {};
	return new Set(Object.keys(maps).filter(id => maps[id] && maps[id].enabled === false));
}

// nothing readable stored is every map on until the fetch lands
function loadMapConfig() {
	return readJson(STORAGE_KEYS.mapConfig);
}

let disabledMaps = new Set();

export function isMapEnabled(id) {
	return !disabledMaps.has(id);
}

function sameIdSet(a, b) {
	return a.size === b.size && [...a].every(id => b.has(id));
}

// no-cache revalidates rather than skips the cache: a switch flipped in the
// file is seen on the next load, not whenever the browser's copy runs out
function fetchMapConfig() {
	fetch(MAP_CONFIG_URL, { cache: 'no-cache' })
		.then(response => response.ok ? response.json() : Promise.reject(response.status))
		.then(config => {
			writeJson(STORAGE_KEYS.mapConfig, config); // the copy is for the next load
			const disabled = disabledMapIds(config);
			if (sameIdSet(disabled, disabledMaps)) return;
			disabledMaps = disabled;
			emit(EVENTS.mapConfigChanged);
		})
		.catch(() => { /* the copy in hand stands: the file out of reach is no reason to show less */ });
}

// the stored copy at once, before the first render, so a map already off is
// never drawn — and the file fetched behind it
export function initRemoteConfig() {
	disabledMaps = disabledMapIds(loadMapConfig());
	fetchMapConfig();
}
