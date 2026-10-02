// Fetching a map afresh, without reloading the page: a widget's [R], the key
// R and the tab's [R]. See INTERNALS.md, Pop-out (the title bar).

import { dlog } from '../lib/debug.js';
import { el, queryAll } from '../lib/dom.js';
import { mapTypeOf } from '../maps/types.js';
import { restartRefresh } from './refresh.js';

export function buildReloadButton() {
	const btn = el('a', { class: 'rl-btn', text: '[R]', title: 'Ponovno učitaj kartu' });
	btn.addEventListener('click', () => {
		const block = btn.closest('.map-block');
		reloadMap(block);
		// the interval runs from the last time the maps were new, and one map
		// made new is all of them only when it is the only one the clock sweeps;
		// among several, the rest are as stale as they were
		const others = reloadableBlocks().filter(other => other !== block);
		if (!others.length) restartRefresh();
	});
	return btn;
}

// a map fetched afresh the way its type is (maps/types.js)
function reloadMap(block) {
	const type = block && mapTypeOf(block.dataset.mapId);
	if (!type || !type.reload) return;
	dlog(`reloadMap: ${block.dataset.mapId}`);
	type.reload(block);
}

// every map with something to re-fetch, popped out or still in the page — all
// but the interactive maps, the same rule that decides whether a title bar
// gets an [R] at all
function reloadableBlocks() {
	return queryAll('.map-block').filter(block => {
		const type = mapTypeOf(block.dataset.mapId);
		return !!type && !!type.reload;
	});
}

export function reloadAllMaps() {
	reloadableBlocks().forEach(reloadMap);
	restartRefresh(); // the interval runs from the last time the maps were actually new
}
