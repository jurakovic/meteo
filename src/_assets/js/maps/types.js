// The kinds of map the catalog holds, and what each kind means wherever that
// matters, in one place: how it is drawn, whether its widget follows the
// map's shape or is sized freely, whether it has a fullscreen of its own, and
// how it is fetched afresh. A new kind of map is an entry here and its build
// function (maps/render.js); nothing else asks what type a map is.

import { catalogMap } from './catalog.js';
import { buildBasicIframe, buildIframe, buildImage, buildSlideshow, buildVideo } from './render.js';

// build(map, inst): the block's contents, title bar first
// freeAspect: an iframe has no shape of its own, so its widget is sized in
//   both dimensions; the others keep the height their aspect ratio gives them
// fullscreen: a map with a fullscreen of its own ([ ]), which the stored
//   arrangement can carry
// reload(block): its contents fetched afresh past the cache; null for an
//   interactive map, whose feed is live of its own accord — navigating its
//   frame again would cost it its pan and its zoom for nothing (its bar keeps
//   its own [X]/[R] gate button instead)
export const MAP_TYPES = {
	slideshow: { build: buildSlideshow, freeAspect: false, fullscreen: false, reload: reloadImages },
	image: { build: buildImage, freeAspect: false, fullscreen: false, reload: reloadImages },
	video: { build: buildVideo, freeAspect: false, fullscreen: false, reload: reloadVideos },
	iframe: { build: buildIframe, freeAspect: true, fullscreen: true, reload: null },
	'iframe-basic': { build: buildBasicIframe, freeAspect: true, fullscreen: false, reload: reloadFrame }
};

// the type of a map, by its id; null for an id the catalog does not know
export function mapTypeOf(mapId) {
	const map = catalogMap(mapId);
	return (map && MAP_TYPES[map.type]) || null;
}

// images are re-fetched past the cache by a fresh query parameter
function reloadImages(block) {
	block.querySelectorAll('img[src]').forEach(img => { img.src = freshUrl(img.getAttribute('src')); });
}

function reloadVideos(block) {
	block.querySelectorAll('video').forEach(video => {
		video.querySelectorAll('source[src]').forEach(source => { source.src = freshUrl(source.getAttribute('src')); });
		video.load();
	});
}

// a plain iframe is navigated to its address again
function reloadFrame(block) {
	block.querySelectorAll('iframe[src]').forEach(iframe => { iframe.src = iframe.getAttribute('src'); });
}

// the url with a reload parameter of its own set to now (replaced when there
// is one already), so the browser fetches instead of serving its cache
export function freshUrl(url) {
	const base = url.replace(/([?&])_r=\d+(&|$)/, (m, sep, next) => next ? sep : '');
	return `${base}${base.includes('?') ? '&' : '?'}_r=${Date.now()}`;
}
