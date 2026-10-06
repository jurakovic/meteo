// Which maps are switched off, so a map whose source is down comes off both
// pages without a build, and which features are on. See INTERNALS.md, Remote
// config.

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

// a feature while config.json doesn't say: a first visit, with no copy yet,
// and a file that leaves it out get this
/** @type {Record<string, boolean>} */
const FEATURE_DEFAULTS = {
	telemetry: false // switched on in the file while a storm brings the visitors
};

// { "features": { "<name>": { "enabled": true } } }; a feature not named, or
// not as true or false, keeps its default
/** @returns {Record<string, boolean>} */
function enabledFeatures(config) {
	const features = config && config.features && typeof config.features === 'object' ? config.features : {};
	return Object.fromEntries(Object.keys(FEATURE_DEFAULTS).map(name => {
		const enabled = features[name] && features[name].enabled;
		return [name, typeof enabled === 'boolean' ? enabled : FEATURE_DEFAULTS[name]];
	}));
}

// read off the stored copy on the first ask, so telemetry.js, which starts
// before initRemoteConfig, gets it too
/** @type {Record<string, boolean> | null} */
let features = null;

/** @param {string} name one of FEATURE_DEFAULTS */
export function isFeatureEnabled(name) {
	if (!features) features = enabledFeatures(loadMapConfig());
	return !!features[name];
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
			const enabled = enabledFeatures(config);
			const flipped = Object.keys(enabled).some(name => enabled[name] !== isFeatureEnabled(name));
			features = enabled;
			if (flipped) emit(EVENTS.featuresChanged);
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
	features = enabledFeatures(loadMapConfig());
	fetchMapConfig();
}
