// Fetching a map afresh: a widget's [R], the key R and the tab's [R].
//
// a widget's [R] fetches its map afresh — the page may have been open long
// enough for new images to be out — without reloading the page. First in
// the cluster, shown only on a popped-out widget (CSS). Not on an
// interactive map, whose bar keeps its own [X]/[R] gate button

import { dlog } from '../lib/debug.js';
import { el } from '../lib/dom.js';
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

function reloadMap(block) {
	if (!block) return;
	dlog(`reloadMap: ${block.dataset.mapId}`);
	// images and videos are re-fetched past the cache by a fresh query parameter
	block.querySelectorAll('img[src]').forEach(img => { img.src = freshUrl(img.getAttribute('src')); });
	block.querySelectorAll('video').forEach(video => {
		video.querySelectorAll('source[src]').forEach(source => { source.src = freshUrl(source.getAttribute('src')); });
		video.load();
	});
	// a plain iframe is navigated to its address again
	block.querySelectorAll('.if2 iframe[src]').forEach(iframe => { iframe.src = iframe.getAttribute('src'); });
}

// the url with a reload parameter of its own set to now (replaced when there
// is one already), so the browser fetches instead of serving its cache
function freshUrl(url) {
	const base = url.replace(/([?&])_r=\d+(&|$)/, (m, sep, next) => next ? sep : '');
	return `${base}${base.includes('?') ? '&' : '?'}_r=${Date.now()}`;
}

// every map with something to re-fetch, popped out or still in the page: the
// images, the slideshows, the videos and the basic frames. An interactive map
// is left out — its feed is live of its own accord, and navigating its frame
// again would cost it its pan and its zoom for nothing — which is the same
// rule that decides whether a title bar gets an [R] at all, read off the
// content here rather than off the button, since a docked map carries none
function reloadableBlocks() {
	return [...document.querySelectorAll('.map-block')]
		.filter(block => block.querySelector('img[src], video, .if2 iframe[src]'));
}

export function reloadAllMaps() {
	reloadableBlocks().forEach(reloadMap);
	restartRefresh(); // the interval runs from the last time the maps were actually new
}
