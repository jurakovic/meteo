// The links: the list at the foot of the page (Linkovi) and its dialog, the
// row under each map and its switch, and the scrolling to either.
// See INTERNALS.md, The links dialog.

import { query, queryAll } from '../lib/dom.js';
import { readJson, STORAGE_KEYS, writeJson } from '../lib/storage.js';
import { registerCommand } from './commands.js';
import { setDialogVisible, toggleDialog } from './dialog.js';

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

// the foot's list in a dialog (L): a copy of it, taken on every open, so the
// markup is the foot's alone and the dialog never shows other links. On the
// dev page the foot is fetched (include.js), and a copy taken before it lands
// would be empty, which is why it is not taken once at start
function fillLinksDialog(panel) {
	const source = query('.maps-foot .links');
	const body = panel.querySelector('.dialog-body');
	if (!source || !body) return;
	const copy = /** @type {HTMLElement} */ (source.cloneNode(true));
	copy.removeAttribute('style'); // the foot's folded max-height
	copy.removeAttribute('data-include-html');
	body.replaceChildren(copy);
}

export function initLinksDialog() {
	const panel = document.getElementById('linksDialog');
	if (!panel) return;
	const close = panel.querySelector('.dialog-close');
	if (close) close.addEventListener('click', () => setDialogVisible(panel, false));
	registerCommand('links-dialog', {
		keys: ['l', 'L'],
		run: () => {
			if (panel.hidden) fillLinksDialog(panel);
			toggleDialog(panel);
		}
	});
}

/** @param {HTMLInputElement} checkbox */
export function toggleLinksBottom(checkbox) {
	document.body.classList.toggle('show-links-bottom', checkbox.checked);
	writeJson(STORAGE_KEYS.linksBottom, checkbox.checked ? 1 : 0); // "1" or "0" in storage
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
