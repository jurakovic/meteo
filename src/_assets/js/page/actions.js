// The controls the markup declares — data-action="…" on a button, a link or a
// checkbox — and one click listener that runs them, so no handler has to be a
// global for an onclick attribute to reach. A module adds its own with
// registerAction; the ones every page has are registered here.

import { switchIframeZoom, toggleFullscreen } from './iframe.js';
import { scrollToElement, scrollToTop, toggleLinksBottom } from './links.js';
import { toggleManual } from './manual.js';
import { plusSlides } from './slideshow.js';

const actions = new Map();

// run(control, event) on a click on any element carrying data-action="name"
export function registerAction(name, run) {
	actions.set(name, run);
}

export function initActions() {
	registerAction('top', () => scrollToTop());
	registerAction('links', () => scrollToElement('links'));
	registerAction('links-bottom', (checkbox) => toggleLinksBottom(checkbox));
	registerAction('manual', () => toggleManual());
	registerAction('slide', (arrow) => plusSlides(arrow.closest('.slideshow'), Number(arrow.dataset.step)));
	registerAction('zoom', (btn) => switchIframeZoom(btn.dataset.frame, btn));
	registerAction('fullscreen', (btn) => toggleFullscreen(btn.dataset.frame, btn));
	document.addEventListener('click', (e) => {
		const control = e.target.closest && e.target.closest('[data-action]');
		const run = control && actions.get(control.dataset.action);
		if (run) run(control, e);
	});
}
