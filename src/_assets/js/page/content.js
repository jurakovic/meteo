// The page's own content, on both pages: the maps' wiring, the links under
// them and at the foot of the page, and what follows the window's width.

import { hideOverlayOnDoubleTap, updateHintText, updateIframeSrc } from './iframe.js';
import { addExpandableClickEventListener, addLinksScrollShadows, initLinksBottom, updateLinksScrollShadows } from './links.js';
import { showProgress } from './progress.js';
import { addSwipeEvents } from './slideshow.js';

// wiring for content inside the maps list; called on load and again after
// maps/render.js re-renders it, so it must only touch freshly created nodes
export function initDynamicContent() {
	document.querySelectorAll('img.lazy').forEach(img => {
		img.src = img.getAttribute('data-src');
		img.classList.remove('lazy');
	});
	addSwipeEvents();
	updateIframeSrc(true); // newly rendered iframes, whatever the width
	hideOverlayOnDoubleTap();
	updateHintText();
	addLinksScrollShadows();
	showProgress();
}

export function initPageContent() {
	initLinksBottom();
	initDynamicContent();
	addExpandableClickEventListener();
}

// debounced: a frame's address changes with the width, and setting it reloads
let resizeTimer = 0;

export function initPageResize() {
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			updateIframeSrc();
			updateHintText();
			updateLinksScrollShadows();
		}, 200);
	});
}
