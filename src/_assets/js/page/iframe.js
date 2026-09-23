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

export function switchIframeZoom(frameId, btn) {
	const newMode = btn.getAttribute('data-mode') === 'hr' ? 'eu' : 'hr';
	const iframe = document.getElementById(frameId);
	iframe.setAttribute('data-zoom-mode', newMode);
	setIframeSrc(iframe);
	btn.setAttribute('data-mode', newMode);
	btn.textContent = newMode === 'hr' ? '[HR]' : '[EU]';
	const resetBtn = getResetButtonFromFrameId(frameId);
	// only the gated [R] hides on a zoom switch; the in-fullscreen [R] must stay
	if (resetBtn.textContent === '[R]' && !iframe.parentElement.classList.contains('fullscreen'))
		resetBtn.style.display = 'none';
}

export function toggleFullscreen(frameId, btn) {
	dlog(`toggleFullscreen: ${frameId}`);
	const if1 = document.getElementById(frameId).parentElement;
	if (if1.classList.contains('fullscreen')) {
		exitFullscreen(if1);
	} else {
		const overlay = if1.querySelector('.overlay');
		const resetBtn = getResetButtonFromFrameId(frameId);
		// snapshot whether the overlay gate was up, to restore it on exit
		if1._fsOverlayVisible = !overlay || overlay.style.display !== 'none';
		if1.classList.add('fullscreen');
		if1.previousElementSibling.classList.add('fullscreen');
		// the page scroll is locked under a map covering it — not under one
		// filling a snap column beside it (customize page), where the page
		// stays in use
		if (!if1.closest('.map-block.snapped')) document.body.classList.add('fs-lock');
		emit(EVENTS.mapFullscreen);
		btn.textContent = '[-]';
		// unlock interactivity: drop the overlay gate
		if (overlay) overlay.style.display = 'none';
		// show [R] in the top bar to reset the map to default without leaving
		// fullscreen; it reloads and stays available for repeated use
		if (resetBtn) setResetButtonToFullscreenReset(resetBtn);
	}
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
	// restore the overlay gate to its pre-fullscreen lock state (tracked on enter)
	const wasUnlocked = if1._fsOverlayVisible === false;
	delete if1._fsOverlayVisible;
	const overlay = if1.querySelector('.overlay');
	if (overlay) {
		if (wasUnlocked) overlay.style.display = 'none';
		else overlay.removeAttribute('style');
	}
	// the map was likely panned/zoomed in fullscreen, so always show the reset
	// button, matching the lock state: [X] (re-lock, then [R]) if it was
	// unlocked, [R] (reset to default) if it was locked
	const resetBtn = getResetButtonFromFrameId(if1.querySelector('iframe').id);
	if (resetBtn) {
		resetBtn.style.removeProperty('display');
		if (wasUnlocked) setResetButtonToExit(resetBtn);
		else setResetButtonToReset(resetBtn);
	}
}

// bound once per overlay, for the reason above
export function hideOverlayOnDoubleTap() {
	const overlays = document.querySelectorAll('.if1 .overlay:not([data-tap])');

	overlays.forEach((overlay) => {
		overlay.setAttribute('data-tap', '');
		let lastTap = 0;
		let multiTouch = false;

		overlay.addEventListener('dblclick', () => {
			overlay.style.display = 'none';
			let resetFrame = getResetButtonFromOverlayId(overlay.id);
			resetFrame.removeAttribute('style');
			setResetButtonToExit(resetFrame);
		});

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
				overlay.style.display = 'none';
				let resetFrame = getResetButtonFromOverlayId(overlay.id);
				resetFrame.removeAttribute('style');
				setResetButtonToExit(resetFrame);

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

			const endX = e.changedTouches[0].clientX;
			const endY = e.changedTouches[0].clientY;

			const deltaX = Math.abs(endX - startX);
			const deltaY = Math.abs(endY - startY);

			// If finger moved more than 10px, treat it as a scroll
			if (deltaX < 10 && deltaY < 10) {
				hint.style.opacity = '0.6';
				clearTimeout(hint._hideTimer);
				hint._hideTimer = setTimeout(() => {
					hint.style.removeProperty('opacity');
				}, 2000);
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

function restoreOverlay(frameId) {
	dlog(`restoreOverlay: ${frameId}`);
	const frame = document.getElementById(frameId);
	let parentElement = frame.parentElement;
	let overlay = parentElement.querySelector('.overlay');
	overlay.removeAttribute('style');

	const resetFrame = getResetButtonFromFrameId(frameId);
	setResetButtonToReset(resetFrame);
}

function setResetButtonToExit(resetFrame) {
	dlog(`setResetButtonToExit: ${resetFrame.id}`);
	const newResetFrame = resetFrame.cloneNode(true);
	resetFrame.parentNode.replaceChild(newResetFrame, resetFrame);

	newResetFrame.addEventListener('click', (e) => {
		e.stopPropagation(); // Stop event bubbling
		restoreOverlay(getFrameIdFromResetButtonId(newResetFrame.id));
	});
	newResetFrame.textContent = '[X]';
}

function setResetButtonToReset(resetFrame) {
	dlog(`setResetButtonToReset: ${resetFrame.id}`);
	const newResetFrame = resetFrame.cloneNode(true);
	resetFrame.parentNode.replaceChild(newResetFrame, resetFrame);

	newResetFrame.addEventListener('click', (e) => {
		e.stopPropagation(); // Stop event bubbling
		resetIframe(getFrameIdFromResetButtonId(newResetFrame.id));
	});
	newResetFrame.textContent = '[R]';
}

function resetIframe(frameId) {
	dlog(`Resetting iframe: ${frameId}`);
	setIframeSrc(document.getElementById(frameId));

	const resetFrame = getResetButtonFromFrameId(frameId);
	resetFrame.style.display = 'none';
	setResetButtonToExit(resetFrame);
}

// in fullscreen [R] reloads the map to its default position and zoom and
// stays, available for repeated use
function setResetButtonToFullscreenReset(resetFrame) {
	dlog(`setResetButtonToFullscreenReset: ${resetFrame.id}`);
	const newResetFrame = resetFrame.cloneNode(true);
	resetFrame.parentNode.replaceChild(newResetFrame, resetFrame);

	newResetFrame.addEventListener('click', (e) => {
		e.stopPropagation(); // Stop event bubbling
		setIframeSrc(document.getElementById(getFrameIdFromResetButtonId(newResetFrame.id)));
	});
	newResetFrame.textContent = '[R]';
	newResetFrame.style.removeProperty('display'); // ensure visible in fullscreen
}

function getResetButtonFromFrameId(frameId) {
	return document.querySelector(`a[data-frame-id="${frameId}"]`);
}

function getResetButtonFromOverlayId(overlayId) {
	const frameId = document.getElementById(overlayId).getAttribute('data-frame-id');
	return getResetButtonFromFrameId(frameId);
}

function getFrameIdFromResetButtonId(resetFrameId) {
	return document.getElementById(resetFrameId).getAttribute('data-frame-id');
}
