// The manual: MANUAL.md, converted at build time (scripts/manual.mjs) and
// built into both pages. It is
// a dialog and not a page of its own so it can be read beside the maps it
// describes rather than in place of them — which costs it the address a page
// would have had, so #upute stands in: it opens the dialog on load, and the
// dialog puts it there and takes it away again, which keeps "read this" a link
// anyone can send.

import { isTextField } from '../lib/dom.js';
import { setDialogVisible, toggleDialog } from './dialog.js';

const MANUAL_HASH = 'upute';

// the manual is off for now: false hides the ? button and the footer's Upute
// and leaves H and #upute alone; true brings it all back. The class goes on
// before the first paint, as board-boot does, so nothing flashes up and away
const MANUAL_ENABLED = false;

export function applyManualSwitch() {
	if (!MANUAL_ENABLED) document.documentElement.classList.add('no-manual');
}

function manualDialog() {
	return document.getElementById('manualDialog');
}

function manualOpen() {
	const panel = manualDialog();
	return !!panel && !panel.hidden;
}

export function toggleManual() {
	toggleDialog(manualDialog());
}

// a hash as text, without its #. A malformed escape (#%E0) is read as it
// stands rather than thrown on: it is not the manual, and a throw here would
// take the rest of initDialogs down with it
function hashText(hash) {
	try {
		return decodeURIComponent(hash.slice(1));
	} catch {
		return hash.slice(1);
	}
}

// replaceState rather than the hash itself: assigning to location.hash stacks
// an entry for every open, so Back would walk out through them one at a time
function syncManualHash(open) {
	const url = new URL(window.location.href);
	const already = hashText(url.hash) === MANUAL_HASH;
	if (open === already) return;
	url.hash = open ? MANUAL_HASH : '';
	history.replaceState(null, '', open ? url.href : url.href.replace(/#$/, ''));
}

// a heading link inside the manual scrolls the dialog's own body. scrollIntoView
// scrolls every ancestor, so it would drag the page behind the dialog along with
// it — the offset between the two rects is what the body has to travel
function scrollManualTo(panel, id) {
	const body = panel.querySelector('.ms-body');
	const target = panel.querySelector(`[id="${CSS.escape(id)}"]`);
	if (!body || !target) return;
	body.scrollTop += target.getBoundingClientRect().top - body.getBoundingClientRect().top;
}

export function initManual() {
	const panel = manualDialog();
	if (!panel || !MANUAL_ENABLED) return;

	const close = panel.querySelector('.ms-close');
	if (close) close.addEventListener('click', () => setDialogVisible(panel, false));

	panel.addEventListener('click', (e) => {
		const link = e.target.closest('a[href^="#"]');
		if (!link || !panel.contains(link)) return;
		e.preventDefault();
		scrollManualTo(panel, hashText(link.getAttribute('href')));
	});

	document.addEventListener('dialog-toggled', (e) => {
		if (e.detail.panel !== panel) return;
		syncManualHash(e.detail.visible);
		if (e.detail.visible) panel.querySelector('.ms-body').scrollTop = 0;
	});

	// H for help: the letters name the thing, as R, G and S do, and ? would
	// need Shift on one layout and AltGr on the next
	document.addEventListener('keydown', (e) => {
		if ((e.key !== 'h' && e.key !== 'H') || e.altKey || e.ctrlKey || e.metaKey || isTextField(e.target)) return;
		e.preventDefault();
		toggleManual();
	});

	// the address, on arrival and whenever it is edited afterwards
	const fromHash = () => {
		const wanted = hashText(window.location.hash) === MANUAL_HASH;
		if (wanted !== manualOpen()) setDialogVisible(panel, wanted);
	};
	window.addEventListener('hashchange', fromHash);
	fromHash();
}
