// The interactive maps: their address for the width and the zoom asked for,
// the gate over them (a double click or tap lets the map have the pointer,
// [X] puts the gate back, [R] reloads the map to where it started), and their
// fullscreen. The page's own; a widget hosting one is widgets/fullscreen.js'.

import { dlog } from '../lib/debug.js';
import { emit, EVENTS } from '../lib/events.js';
import { isNarrowViewport } from '../lib/media.js';

// the width the frames' addresses were last set for: they depend on it only
// across the breakpoint, and setting one reloads it
let previousWidth = 0;

export function updateIframeSrc(force = false) {
	if (!force && window.innerWidth === previousWidth) return;
	previousWidth = window.innerWidth;
	document.querySelectorAll('iframe[data-zoom-hr-desktop]').forEach(iframe => setIframeSrc(iframe));
}

export function setIframeSrc(iframe) {
	dlog(`Updating iframe src for ${iframe.id}`);
	const mode = iframe.getAttribute('data-zoom-mode');
	let url = mode === 'eu'
		? iframe.getAttribute('data-src-eu')
		: iframe.getAttribute('data-src-hr');
	if (isNarrowViewport()) {
		const desktopAttr = mode === 'eu' ? 'data-zoom-eu-desktop' : 'data-zoom-hr-desktop';
		const mobileAttr = mode === 'eu' ? 'data-zoom-eu-mobile' : 'data-zoom-hr-mobile';
		url = url.replace(iframe.getAttribute(desktopAttr), iframe.getAttribute(mobileAttr));
	}
	iframe.src = url;
}

// The gate's button, beside the map's title, as a state (data-state):
// - hidden: the gate is up over the map as it loaded; nothing to offer
// - exit: [X], the gate let through — a press puts it back up
// - reset: [R], the gate back up over a map that may have been moved — a
//   press reloads the map as it started, and the button goes
// - fullscreen: [R] in fullscreen, where a press reloads the map and the
//   button stays, for repeated use
const GATE_LABELS = { hidden: '[X]', exit: '[X]', reset: '[R]', fullscreen: '[R]' };

function gateButton(frameId) {
	return document.querySelector(`a[data-frame-id="${frameId}"]`);
}

function gateState(frameId) {
	const btn = gateButton(frameId);
	return btn ? btn.dataset.state || 'hidden' : null;
}

function setGateState(frameId, state) {
	const btn = gateButton(frameId);
	if (!btn) return;
	dlog(`gate ${frameId}: ${state}`);
	btn.dataset.state = state;
	btn.textContent = GATE_LABELS[state];
	if (state === 'hidden') btn.style.display = 'none';
	else btn.style.removeProperty('display');
}

function overlayOf(frameId) {
	return document.getElementById(frameId).parentElement.querySelector('.overlay');
}

// the gate let through: the map takes the pointer
function openGate(frameId) {
	overlayOf(frameId).style.display = 'none';
	setGateState(frameId, 'exit');
}

// the gate's button pressed (the gate command, page/commands.js)
export function pressGateButton(btn) {
	const frameId = btn.dataset.frameId;
	switch (btn.dataset.state) {
		case 'exit':
			overlayOf(frameId).removeAttribute('style');
			setGateState(frameId, 'reset');
			break;
		case 'reset':
			setIframeSrc(document.getElementById(frameId));
			setGateState(frameId, 'hidden');
			break;
		case 'fullscreen':
			setIframeSrc(document.getElementById(frameId));
			break;
	}
}

export function switchIframeZoom(frameId, btn) {
	const newMode = btn.getAttribute('data-mode') === 'hr' ? 'eu' : 'hr';
	const iframe = document.getElementById(frameId);
	iframe.setAttribute('data-zoom-mode', newMode);
	setIframeSrc(iframe);
	btn.setAttribute('data-mode', newMode);
	btn.textContent = newMode === 'hr' ? '[HR]' : '[EU]';
	// the map is at its start again, so [R] has nothing left to do; in
	// fullscreen the button stays, as it always does there
	if (gateState(frameId) === 'reset') setGateState(frameId, 'hidden');
}

// whether the gate was up as a map went into fullscreen, to put it back so
const gateBeforeFullscreen = new WeakMap();

export function toggleFullscreen(frameId, btn) {
	dlog(`toggleFullscreen: ${frameId}`);
	const if1 = document.getElementById(frameId).parentElement;
	if (if1.classList.contains('fullscreen')) {
		exitFullscreen(if1);
		return;
	}
	const overlay = if1.querySelector('.overlay');
	gateBeforeFullscreen.set(if1, !overlay || overlay.style.display !== 'none');
	if1.classList.add('fullscreen');
	if1.previousElementSibling.classList.add('fullscreen');
	// the page scroll is locked under a map covering it — not under one
	// filling a snap column beside it (customize page), where the page
	// stays in use
	if (!if1.closest('.map-block.snapped')) document.body.classList.add('fs-lock');
	emit(EVENTS.mapFullscreen);
	btn.textContent = '[-]';
	// the map is the thing in use now: the gate goes, and [R] puts the map
	// back to its start without leaving fullscreen
	if (overlay) overlay.style.display = 'none';
	setGateState(frameId, 'fullscreen');
}

export function exitFullscreen(if1) {
	if1.classList.remove('fullscreen');
	const title = if1.previousElementSibling;
	title.classList.remove('fullscreen');
	const btn = title.querySelector('.fs-btn');
	if (btn) btn.textContent = '[ ]';
	if (![...document.querySelectorAll('.if1.fullscreen')].some(f => !f.closest('.map-block.snapped')))
		document.body.classList.remove('fs-lock');
	emit(EVENTS.mapFullscreen);
	// the gate as it was before; and the map was likely panned or zoomed in
	// fullscreen, so the button is always offered: [X] if the gate was let
	// through, [R] if it was up
	const wasUnlocked = gateBeforeFullscreen.get(if1) === false;
	gateBeforeFullscreen.delete(if1);
	const overlay = if1.querySelector('.overlay');
	if (overlay) {
		if (wasUnlocked) overlay.style.display = 'none';
		else overlay.removeAttribute('style');
	}
	setGateState(if1.querySelector('iframe').id, wasUnlocked ? 'exit' : 'reset');
}

// the hint's fade-out, per hint
const hintTimers = new WeakMap();

// bound once per overlay: a double click, or a double tap, lets the map
// through; a single tap shows the hint that says so
export function hideOverlayOnDoubleTap() {
	document.querySelectorAll('.if1 .overlay:not([data-tap])').forEach((overlay) => {
		overlay.setAttribute('data-tap', '');
		const frameId = overlay.dataset.frameId;
		let lastTap = 0;
		let multiTouch = false;

		overlay.addEventListener('dblclick', () => openGate(frameId));

		overlay.addEventListener('touchstart', (e) => {
			if (e.touches.length > 1) multiTouch = true;
		});

		overlay.addEventListener('touchend', (e) => {
			// Ignore multi-touch gestures (e.g. pinch-zoom): their two quick touchend
			// events can otherwise be mistaken for a double-tap and hide the overlay.
			if (multiTouch) {
				if (e.touches.length === 0) {
					multiTouch = false;
					lastTap = 0;
				}
				return;
			}
			const currentTime = new Date().getTime();
			const tapLength = currentTime - lastTap;
			if (tapLength > 0 && tapLength < 200) {
				openGate(frameId);
				e.preventDefault(); // prevent unintended behavior (e.g. zoom)
			}
			lastTap = currentTime;
		});

		const hint = overlay.querySelector('.hint');
		let startY = 0;
		let startX = 0;

		overlay.addEventListener('touchstart', (e) => {
			if (e.touches.length === 1) {
				startX = e.touches[0].clientX;
				startY = e.touches[0].clientY;
			}
		});

		overlay.addEventListener('touchend', (e) => {
			if (!hint) return;
			const deltaX = Math.abs(e.changedTouches[0].clientX - startX);
			const deltaY = Math.abs(e.changedTouches[0].clientY - startY);
			// a finger that moved more than 10px was scrolling
			if (deltaX < 10 && deltaY < 10) {
				hint.style.opacity = '0.6';
				clearTimeout(hintTimers.get(hint));
				hintTimers.set(hint, setTimeout(() => hint.style.removeProperty('opacity'), 2000));
			}
		});
	});
}

export function updateHintText() {
	const isMobile = isNarrowViewport();
	document.querySelectorAll('.hint').forEach(hint => {
		hint.textContent = isMobile
			? "Dvostruki dodir za pristup interaktivnoj karti"
			: "Dvostruki klik za pristup interaktivnoj karti";
	});
}

// whichever interactive map is in fullscreen, out of it (Escape)
export function exitAnyFullscreen() {
	const fs = document.querySelector('.if1.fullscreen');
	if (fs) exitFullscreen(fs);
}
