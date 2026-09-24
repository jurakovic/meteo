// The dialogs — the maps picker (settings/panel.js) and the manual — over one
// set of chrome: a fixed panel above everything, dismissed by a press outside,
// the page held still underneath, and on desktop a window, dragged by its head
// and resized from any side or corner, each remembering where it was put under
// the key its element names (data-dialog-key). Both pages carry the manual, so
// this is page chrome rather than the customize page's.
//
// One stands at a time: opening one shuts the other, so there is a single
// backdrop, a single scroll lock and a single Escape to reason about. Every
// change is announced as a dialog-toggled event.

import { query, queryAll } from '../lib/dom.js';
import { emit, EVENTS } from '../lib/events.js';
import { clamp, roundFraction, setScrollbarGutter, viewportHeight, viewportWidth } from '../lib/geometry.js';
import { DESKTOP_MQ } from '../lib/media.js';
import { pulledSize, RESIZE_HANDLES, trackPointer } from '../lib/pointer.js';
import { readJson, removeKey, writeJson } from '../lib/storage.js';

const DIALOG_MIN_WIDTH = 360;

const DIALOG_MIN_HEIGHT = 120;

const DIALOG_MARGIN = 8; // kept free of the viewport edge when sizing

function dialogPanels() {
	return queryAll('.map-settings');
}

function openDialogPanel() {
	return dialogPanels().find(panel => !panel.hidden) || null;
}

export function anyDialogOpen() {
	return !!openDialogPanel();
}

// this browser's, not the view's (the same footing as msTab and the grid
// switches): it is about this screen and travels in neither a preset nor a
// link. The left and top go as fractions of the viewport, the width in px, and
// the height in px only once it has been resized — until when it stays the
// CSS's, capped to what is left below wherever the top now is
function dialogStorageKey(panel) {
	return panel.getAttribute('data-dialog-key');
}

function loadDialogGeometry(panel) {
	const key = dialogStorageKey(panel);
	if (!key) return null;
	const stored = readJson(key);
	if (!stored || typeof stored !== 'object') return null;
	if (!Number.isFinite(stored.left) || !Number.isFinite(stored.top) || !(stored.width > 0)) return null;
	return { left: stored.left, top: stored.top, width: stored.width, height: stored.height > 0 ? stored.height : null };
}

function saveDialogGeometry(panel) {
	const key = dialogStorageKey(panel);
	if (!key) return;
	const rect = panel.getBoundingClientRect();
	const stored = {
		left: roundFraction(rect.left / viewportWidth()),
		top: roundFraction(rect.top / viewportHeight()),
		width: Math.round(rect.width)
	};
	if (panel.style.height) stored.height = Math.round(rect.height); // only once resized; else the CSS's
	writeJson(key, stored);
}

function forgetDialogGeometry(panel) {
	const key = dialogStorageKey(panel);
	if (!key) return;
	removeKey(key);
}

function dialogMaxWidth() {
	return Math.max(DIALOG_MIN_WIDTH, viewportWidth() - DIALOG_MARGIN * 2);
}

function dialogMaxHeight() {
	return Math.max(DIALOG_MIN_HEIGHT, viewportHeight() - DIALOG_MARGIN * 2);
}

// height null leaves it the CSS's. The CSS's max-height assumes the top the
// CSS set, and the dialog may be anywhere now, so it is recomputed from where
// the top is asked to be; the top is then held to the height that gave
function placeDialog(panel, left, top, width, height) {
	width = clamp(width, DIALOG_MIN_WIDTH, dialogMaxWidth());
	panel.style.width = `${Math.round(width)}px`;
	panel.style.maxWidth = 'none';
	panel.style.right = 'auto'; // off the centring
	panel.style.margin = '0';
	if (height === null) {
		panel.style.height = '';
		panel.style.maxHeight = `${Math.round(Math.max(DIALOG_MIN_HEIGHT, viewportHeight() - Math.max(0, top) - DIALOG_MARGIN))}px`;
	} else {
		panel.style.maxHeight = 'none';
		panel.style.height = `${Math.round(clamp(height, DIALOG_MIN_HEIGHT, dialogMaxHeight()))}px`;
	}
	panel.style.left = `${Math.round(clamp(left, 0, Math.max(0, viewportWidth() - panel.offsetWidth)))}px`;
	panel.style.top = `${Math.round(clamp(top, 0, Math.max(0, viewportHeight() - panel.offsetHeight)))}px`;
}

function clearDialog(panel) {
	['left', 'top', 'width', 'height', 'maxWidth', 'maxHeight', 'right', 'margin'].forEach(prop => panel.style[prop] = '');
}

// on open, and on a window resize, so it cannot be stranded off screen. A phone
// gets the dialog the CSS draws, as it gets no widgets
function applyStoredDialog(panel) {
	if (!panel || panel.hidden) return;
	const stored = DESKTOP_MQ.matches ? loadDialogGeometry(panel) : null;
	if (!stored) { clearDialog(panel); return; }
	placeDialog(panel, stored.left * viewportWidth(), stored.top * viewportHeight(), stored.width, stored.height);
}

// the widgets' own handles, inside the panel so the press that grabs one is a
// press inside the dialog and misses the backdrop that would shut it. Built
// again rather than kept, for the picker, whose body is rebuilt on every open
export function buildDialogHandles(panel) {
	panel.querySelectorAll(':scope > .po-h').forEach(handle => handle.remove());
	RESIZE_HANDLES.forEach(dir => {
		const handle = document.createElement('div');
		handle.className = `po-h po-h-${dir}`;
		handle.dataset.dir = dir;
		panel.appendChild(handle);
	});
}

// one listener per panel, which outlives the rebuild its children do not
function initDialogWindow(panel) {
	panel.addEventListener('pointerdown', (e) => {
		if (e.button !== 0 || !DESKTOP_MQ.matches) return;
		const handle = e.target.closest('.po-h');
		// the head is the grip, but a link or a button on it is itself
		const head = !handle && e.target.closest('.ms-head') && !e.target.closest('a, button, input');
		if (!handle && !head) return;
		e.preventDefault();
		const start = panel.getBoundingClientRect();
		const dir = handle ? handle.dataset.dir : null;
		const kept = panel.style.height ? start.height : null; // a drag leaves the height as it was found
		let moved = false;
		trackPointer(e, (dx, dy) => {
			if (!moved && !dx && !dy) return; // a press that never moved stores nothing
			moved = true;
			if (!dir) {
				placeDialog(panel, start.left + dx, start.top + dy, start.width, kept);
				return;
			}
			let { w: width, h: height } = pulledSize(dir, start, dx, dy);
			// clamped here as well as in placeDialog, so the edge that stays put does
			width = clamp(width, DIALOG_MIN_WIDTH, dialogMaxWidth());
			height = clamp(height, DIALOG_MIN_HEIGHT, dialogMaxHeight());
			placeDialog(panel, dir.includes('w') ? start.right - width : start.left,
				dir.includes('n') ? start.bottom - height : start.top, width, height);
		}, () => { if (moved) saveDialogGeometry(panel); });
	});
	// the way back to the dialog the CSS draws, the head's spare gesture
	panel.addEventListener('dblclick', (e) => {
		if (!DESKTOP_MQ.matches || !e.target.closest('.ms-head') || e.target.closest('a, button, input')) return;
		clearDialog(panel);
		forgetDialogGeometry(panel);
	});
}

// the page's own state, read off whichever dialogs are up rather than set by
// the one being opened: with two of them, a dialog shutting to let another
// stand must not take the lock, the gutter or the backdrop away with it
function syncDialogChrome() {
	const open = anyDialogOpen();
	if (open && !document.documentElement.classList.contains('ms-gutter')) {
		// the scrollbar the lock takes away, held in its place for as long as a
		// dialog stands (html.ms-gutter) so nothing centred on the page shifts
		// under it. It can only be measured while it is still there, so it is
		// taken when the first dialog opens and kept until the last one shuts
		const scrollbar = window.innerWidth - document.documentElement.clientWidth;
		if (scrollbar > 0) {
			setScrollbarGutter(scrollbar);
			document.documentElement.classList.add('ms-gutter');
		}
	} else if (!open) {
		setScrollbarGutter(0);
		document.documentElement.classList.remove('ms-gutter');
	}
	document.body.classList.toggle('ms-open', open);
	const backdrop = query('.ms-backdrop');
	if (backdrop) {
		backdrop.hidden = !open;
		if (open) backdrop.classList.remove('ms-spent'); // it paints again for a dialog that is back
	}
}

// every change of state is announced, the one made room for as much as the one
// asked for: a dialog shut to let another stand is still shut, and what hangs
// off that — the Karte button's arrow, the manual's hash — has no other way of
// hearing about it
function notifyDialog(panel, visible) {
	emit(EVENTS.dialogToggled, { panel, visible });
}

/** @param {boolean} visible */
export function setDialogVisible(panel, visible) {
	if (visible) {
		dialogPanels().forEach(other => {
			if (other === panel || other.hidden) return;
			other.hidden = true;
			notifyDialog(other, false);
		});
	}
	panel.hidden = !visible;
	syncDialogChrome();
	if (visible) applyStoredDialog(panel); // where the user put it, measurable only now it is shown
	notifyDialog(panel, visible);
}

export function toggleDialog(panel) {
	if (!panel) return;
	setDialogVisible(panel, panel.hidden);
}

export function closeOpenDialog() {
	const panel = openDialogPanel();
	if (panel) setDialogVisible(panel, false);
	return !!panel;
}

// A press outside the dialog shuts it, dropping its edits, and does nothing
// else: it lands on the backdrop, so it follows no link and takes no widget.
// (The tab stands above the backdrop and shuts the dialog with its own click.)
// The pointerdown, the release and the click all belong to the dismissal, so
// the backdrop stops painting at once but stays until the click, which is
// swallowed in the capture phase; a release no click follows (let go outside
// the window, a drag) takes it down after a moment
function initDialogBackdrop() {
	const backdrop = query('.ms-backdrop');
	if (!backdrop) return;
	backdrop.addEventListener('pointerdown', (e) => {
		if (!anyDialogOpen()) return;
		e.preventDefault();
		closeOpenDialog();
		backdrop.hidden = false;
		backdrop.classList.add('ms-spent');
		let timer = 0;
		const done = () => {
			clearTimeout(timer);
			backdrop.classList.remove('ms-spent');
			// a dialog may have been opened again meanwhile (K, ?, the tab), and
			// then the ground it stands on is not this gesture's to take away
			backdrop.hidden = !anyDialogOpen();
			document.removeEventListener('click', swallow, true);
			document.removeEventListener('pointerup', release);
			document.removeEventListener('pointercancel', done);
		};
		const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); done(); };
		const release = () => { timer = setTimeout(done, 400); };
		document.addEventListener('click', swallow, true);
		document.addEventListener('pointerup', release);
		document.addEventListener('pointercancel', done);
	});
}

export function initDialogs() {
	dialogPanels().forEach(panel => {
		buildDialogHandles(panel);
		initDialogWindow(panel);
	});
	initDialogBackdrop();
	window.addEventListener('resize', () => applyStoredDialog(openDialogPanel()));
}
