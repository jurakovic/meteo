// Which maps are switched off, from a file beside the maps' own sources, so a
// map whose source is down can be taken off both pages without a build. It is
// read from the last copy this browser saw, at once, and fetched again behind
// that for the next load — or for this one, if it changed. A map the file does
// not name is on, and so is every map when there is no copy yet or the fetch
// fails: a broken file hides nothing.
//
// Loaded first on both pages, since maps.js asks isMapEnabled() while it renders,
// which in dev is as soon as it runs. Off is hidden, not removed, on both:
// - the landing page's maps are static rows carrying data-map-id, so a style
//   rule takes a map's rows out, with the spacer after them
// - the customize page leaves the map out of what it shows (maps.js) and draws
//   the view again on a change, on the map-config-changed event
const MAP_CONFIG_URL = 'https://meteo-data.jurakovic.workers.dev/config.json';
const MAP_CONFIG_KEY = 'mapConfig';

// { "maps": { "<id>": { "enabled": false } } } — anything else is ignored
function disabledMapIds(config) {
	const maps = config && config.maps && typeof config.maps === 'object' ? config.maps : {};
	return new Set(Object.keys(maps).filter(id => maps[id] && maps[id].enabled === false));
}

function loadMapConfig() {
	try {
		return JSON.parse(localStorage.getItem(MAP_CONFIG_KEY));
	} catch (e) {
		return null; // corrupt storage: every map on until the fetch lands
	}
}

let disabledMaps = disabledMapIds(loadMapConfig());

function isMapEnabled(id) {
	return !disabledMaps.has(id);
}

function sameIdSet(a, b) {
	return a.size === b.size && [...a].every(id => b.has(id));
}

// the landing page's rows. Set from <head> in the build, where this is inlined,
// so a map already off is never painted. Only a tr carries the id on that page;
// the customize page puts it on blocks and dialog rows, which this leaves alone.
// The ids come from a remote file, hence the escape
function styleDisabledMaps() {
	let style = document.getElementById('mapConfigStyle');
	if (!style) {
		style = document.createElement('style');
		style.id = 'mapConfigStyle';
		document.head.appendChild(style);
	}
	const rows = [...disabledMaps].map(id => `tr[data-map-id="${CSS.escape(id)}"]`);
	style.textContent = rows.length
		? rows.map(row => `${row}, ${row} + tr.sp20`).join(',\n') + ' { display: none; }'
		: '';
}

// no-cache revalidates rather than skips the cache: a switch flipped in the
// file is seen on the next load, not whenever the browser's copy runs out
function fetchMapConfig() {
	fetch(MAP_CONFIG_URL, { cache: 'no-cache' })
		.then(response => response.ok ? response.json() : Promise.reject(response.status))
		.then(config => {
			try {
				localStorage.setItem(MAP_CONFIG_KEY, JSON.stringify(config));
			} catch (e) { /* storage disabled or full — the copy is for the next load only */ }
			const disabled = disabledMapIds(config);
			if (sameIdSet(disabled, disabledMaps)) return;
			disabledMaps = disabled;
			styleDisabledMaps();
			document.dispatchEvent(new CustomEvent('map-config-changed'));
		})
		.catch(() => { /* the copy in hand stands: the file out of reach is no reason to show less */ });
}

styleDisabledMaps();
fetchMapConfig();
