// The links: the list at the foot of the page (Linkovi), the row under each
// map and its switch, and the scrolling to either.

import { query, queryAll } from '../lib/dom.js';
import { readJson, STORAGE_KEYS, writeJson } from '../lib/storage.js';

export function scrollToTop() {
	window.scrollTo({
		top: 0,
		behavior: 'smooth'
	});
}

/** @param {string} id */
export function scrollToElement(id) {
	const element = document.getElementById(id);
	if (element) {
		element.scrollIntoView({
			behavior: 'smooth',
			block: 'start'
		});
	}
}

// Linkovi at the foot: the list opens to its height (the transition is on
// max-height) and the page scrolls to it once it has
export function addExpandableClickEventListener() {
	const expandable = query('.expandable');
	const content = query('.links');
	expandable.addEventListener('click', () => {
		const arrow = expandable.querySelector('.arrow');
		if (content.style.maxHeight) {
			content.style.maxHeight = '';
			arrow.textContent = '▼';
			return;
		}
		content.style.maxHeight = `${content.scrollHeight}px`;
		arrow.textContent = '▲';
		setTimeout(() => {
			// the page's own smooth scrolling off for the jump, so the one
			// scrollIntoView asks for runs every time, then back on
			document.documentElement.style.scrollBehavior = 'auto';
			document.body.style.scrollBehavior = 'auto';
			scrollToElement('links');
			setTimeout(() => {
				document.documentElement.style.scrollBehavior = 'smooth';
				document.body.style.scrollBehavior = 'smooth';
			}, 50);
		}, 310); // the list's transition, and a frame
	});
}

/** @param {HTMLInputElement} checkbox */
export function toggleLinksBottom(checkbox) {
	document.body.classList.toggle('show-links-bottom', checkbox.checked);
	writeJson(STORAGE_KEYS.linksBottom, checkbox.checked ? 1 : 0); // "1" or "0", as it always was
	updateLinksScrollShadows();
}

export function initLinksBottom() {
	const checkbox = /** @type {HTMLInputElement | null} */ (document.querySelector('.links-toggle'));
	if (!checkbox) return;
	checkbox.checked = readJson(STORAGE_KEYS.linksBottom) === 1;
	document.body.classList.toggle('show-links-bottom', checkbox.checked);
}

/** @param {HTMLElement} bar */
export function updateLinksScrollShadow(bar) {
	const max = bar.scrollWidth - bar.clientWidth;
	const left = bar.scrollLeft;
	bar.classList.toggle('can-scroll-left', left > 1);
	bar.classList.toggle('can-scroll-right', max > 1 && left < max - 1);
}

export function updateLinksScrollShadows() {
	queryAll('.links-bottom').forEach(updateLinksScrollShadow);
}

export function addLinksScrollShadows() {
	queryAll('.links-bottom').forEach(bar => {
		bar.addEventListener('scroll', () => updateLinksScrollShadow(bar), { passive: true });
	});
	updateLinksScrollShadows();
}
