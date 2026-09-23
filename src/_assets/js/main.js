function scrollToTop() {
	window.scrollTo({
		top: 0,
		behavior: 'smooth'
	});
}

function scrollToElement(id) {
	const element = document.getElementById(id);
	if (element) {
		element.scrollIntoView({
			behavior: 'smooth',
			block: 'start'
		});
	}
}

function addExpandableClickEventListener() {
	const expandable = document.querySelector(".expandable");
	expandable.addEventListener("click", function () {
		let arrow = this.querySelector(".arrow");
		const content = document.querySelector(".links");
		if (content.style.maxHeight) {
			content.style.maxHeight = null;
			arrow.textContent = "▼";
		} else {
			content.style.maxHeight = content.scrollHeight + "px";
			arrow.textContent = "▲";
			setTimeout(() => {
				// reset smooth scrolling to make it work every time
				document.documentElement.style.scrollBehavior = "auto";
				document.body.style.scrollBehavior = "auto";

				// apply smooth scroll
				scrollToElement('links');

				// re-enable smooth scrolling after a short delay
				setTimeout(() => {
					document.documentElement.style.scrollBehavior = "smooth";
					document.body.style.scrollBehavior = "smooth";
				}, 50);
			}, 310);
		}
	});
}

function toggleLinksBottom(checkbox) {
	document.body.classList.toggle('show-links-bottom', checkbox.checked);
	localStorage.setItem('showLinksBottom', checkbox.checked ? '1' : '0');
	updateLinksScrollShadows();
}

function initLinksBottom() {
	const checkbox = document.querySelector('.links-toggle');
	if (!checkbox) return;
	checkbox.checked = localStorage.getItem('showLinksBottom') === '1';
	document.body.classList.toggle('show-links-bottom', checkbox.checked);
}

function plusSlides(slideshowId, n) {
	const slideshow = document.querySelector(`.slideshow[data-slideshow-id="${slideshowId}"]`);
	showSlides(slideshow, parseInt(slideshow.getAttribute('data-current-slide')) + n);
}

function showSlides(slideshow, n) {
	const slideshowId = slideshow.getAttribute('data-slideshow-id');
	const slides = slideshow.querySelectorAll('.slide');
	const indicators = document.querySelectorAll(`.indicators-container[data-slideshow-id="${slideshowId}"] .indicator`);
	let current = n;
	if (current > slides.length) { current = 1; }
	if (current < 1) { current = slides.length; }
	slideshow.setAttribute('data-current-slide', current);
	slides.forEach(slide => slide.classList.remove('active'));
	slides[current - 1].classList.add('active');
	indicators.forEach(indicator => indicator.classList.remove('active'));
	indicators[current - 1].classList.add('active');
	updateSlideshowWidth(slideshow);
}

function updateSlideshowWidth(slideshow) {
	if (!slideshow.hasAttribute('data-dynamic-width')) return;

	const slideshowId = slideshow.getAttribute('data-slideshow-id');
	const indicatorsContainer = document.querySelector(`.indicators-container[data-slideshow-id='${slideshowId}']`);
	const activeSlide = slideshow.querySelector('.slide.active .placeholder');
	if (!activeSlide) return; // only titled slides have a .placeholder wrapper

	slideshow.style.maxWidth = activeSlide.style.maxWidth;
	indicatorsContainer.style.maxWidth = activeSlide.style.maxWidth;
}


function showProgress() {
	// Get all images on the page
	const images = document.querySelectorAll('img');
	const progressBar = document.querySelector('.progress-bar');
	const progressContainer = document.querySelector('.progress-container');
	let imagesLoaded = 0;

	// each invocation gets a token; listeners left over from a superseded run
	// (e.g. Primijeni clicked while images are still loading) bail out so they
	// can't move the shared bar or schedule a hide over the current run
	const runId = (progressContainer._runId || 0) + 1;
	progressContainer._runId = runId;

	// re-runnable after a re-render: reset the bar, show the container and
	// cancel a hide still pending from the previous run
	clearTimeout(progressContainer._hideTimer);
	progressBar.style.width = '0';
	progressContainer.style.removeProperty('display');

	// nothing to track (e.g. all maps unselected) — hide the bar right away
	if (images.length === 0) {
		progressContainer.style.display = 'none';
		return;
	}

	// Update progress bar
	const updateProgress = () => {
		if (progressContainer._runId !== runId) return; // superseded by a newer run
		const percent = (imagesLoaded / images.length) * 100;
		progressBar.style.width = percent + '%';

		// Hide the progress bar when all images are loaded
		if (imagesLoaded === images.length) {
			progressContainer._hideTimer = setTimeout(() => {
				progressContainer.style.display = 'none';
			}, 500); // Hide after a short delay
		}
	};

	// Attach load and error events to each image
	images.forEach((img) => {
		img.addEventListener('load', () => {
			imagesLoaded++;
			updateProgress();
		});

		img.addEventListener('error', () => {
			imagesLoaded++; // Count error images as "loaded" to avoid getting stuck
			dlog(`Error loading image: ${img.src}`);
			img.removeAttribute('src'); // Remove src to prevent broken image icon
			updateProgress();
		});

		if (img.complete) {
			img.dispatchEvent(new Event('load')); // Manually trigger 'load' if already loaded
		}
	});
}

function handleSwipe(slideshow, startX, endX) {
	const threshold = 50;
	const distance = endX - startX;
	if (Math.abs(distance) > threshold) {
		const current = parseInt(slideshow.getAttribute('data-current-slide'));
		showSlides(slideshow, current + (distance > 0 ? -1 : 1));
	}
}

// bound once per slideshow: a copy made at runtime (popout.js) wires itself
// through here, and the sweep must pass over everything already bound rather
// than hang a second set of handlers on it
function addSwipeEvents() {
	const slideshows = document.querySelectorAll('.slideshow:not([data-swipe])');

	slideshows.forEach(slideshow => {
		slideshow.setAttribute('data-swipe', '');
		let startX = 0;
		let startY = 0;
		let endX = 0;
		let endY = 0;
		let isDragging = false;

		// Prevent default drag behavior on images
		const images = slideshow.querySelectorAll('img');
		images.forEach(img => {
			img.addEventListener('dragstart', (e) => e.preventDefault());
		});

		// Touch events for mobile
		slideshow.addEventListener('touchstart', (e) => {
			// Ignore multi-touch (e.g. pinch-zoom); only single-finger swipes change slides
			if (e.touches.length > 1) {
				isDragging = false;
				return;
			}
			startX = e.touches[0].clientX;
			startY = e.touches[0].clientY;
			isDragging = false;
		});

		slideshow.addEventListener('touchmove', (e) => {
			if (e.touches.length > 1) {
				isDragging = false;
				return;
			}
			endX = e.touches[0].clientX;
			endY = e.touches[0].clientY;

			// If the finger moves horizontally, set isDragging to true
			if (Math.abs(endX - startX) > Math.abs(endY - startY)) {
				isDragging = true;
			}
		});

		slideshow.addEventListener('touchend', () => {
			if (isDragging) {
				const deltaX = endX - startX;
				const deltaY = endY - startY;

				// Only trigger swipe if horizontal movement is greater than vertical movement (prevent swipe on scroll up or down)
				if (Math.abs(deltaX) > Math.abs(deltaY)) {
					handleSwipe(slideshow, startX, endX);
				}
			}
		});

		// Prevent prev/next buttons from changing the slide during a pinch-zoom gesture.
		// A two-finger touch still synthesizes a click on the button, so suppress that
		// click whenever more than one finger was involved in the gesture.
		slideshow.querySelectorAll('.prev, .next').forEach(btn => {
			let multiTouch = false;
			btn.addEventListener('touchstart', (e) => {
				if (e.touches.length > 1) multiTouch = true;
			});
			btn.addEventListener('touchend', (e) => {
				if (multiTouch) e.preventDefault(); // cancel the click that would follow
				if (e.touches.length === 0) multiTouch = false; // reset once all fingers lift
			});
		});

		// Mouse events for desktop
		slideshow.addEventListener('mousedown', (e) => {
			startX = e.clientX;
			startY = e.clientY;
			isDragging = true;
		});

		slideshow.addEventListener('mousemove', (e) => {
			if (isDragging) {
				endX = e.clientX;
				endY = e.clientY;
			}
		});

		slideshow.addEventListener('mouseup', (e) => {
			if (isDragging) {
				endX = e.clientX;
				endY = e.clientY;
				const deltaX = endX - startX;
				const deltaY = endY - startY;

				// Only trigger swipe if horizontal movement is greater than vertical movement (prevent swipe on scroll up or down)
				if (Math.abs(deltaX) > Math.abs(deltaY)) {
					handleSwipe(slideshow, startX, endX);
				}
				isDragging = false;
			}
		});

		// Handle mouse leaving the slideshow area
		slideshow.addEventListener('mouseleave', () => {
			if (isDragging) {
				isDragging = false;
			}
		});
	});
}

function updateLinksScrollShadow(bar) {
	const max = bar.scrollWidth - bar.clientWidth;
	const left = bar.scrollLeft;
	bar.classList.toggle('can-scroll-left', left > 1);
	bar.classList.toggle('can-scroll-right', max > 1 && left < max - 1);
}

function updateLinksScrollShadows() {
	document.querySelectorAll('.links-bottom').forEach(updateLinksScrollShadow);
}

function addLinksScrollShadows() {
	document.querySelectorAll('.links-bottom').forEach(bar => {
		bar.addEventListener('scroll', () => updateLinksScrollShadow(bar), { passive: true });
	});
	updateLinksScrollShadows();
}

let previousWidth = 0;

function updateIframeSrc() {
	if (window.innerWidth === previousWidth) return;
	previousWidth = window.innerWidth;
	document.querySelectorAll('iframe[data-zoom-hr-desktop]').forEach(iframe => setIframeSrc(iframe));
}

function setIframeSrc(iframe) {
	dlog(`Updating iframe src for ${iframe.id}`);
	const mode = iframe.getAttribute('data-zoom-mode');
	let url = mode === 'eu'
		? iframe.getAttribute('data-src-eu')
		: iframe.getAttribute('data-src-hr');
	if (window.innerWidth < 800) {
		const desktopAttr = mode === 'eu' ? 'data-zoom-eu-desktop' : 'data-zoom-hr-desktop';
		const mobileAttr = mode === 'eu' ? 'data-zoom-eu-mobile' : 'data-zoom-hr-mobile';
		url = url.replace(iframe.getAttribute(desktopAttr), iframe.getAttribute(mobileAttr));
	}
	iframe.src = url;
}

function switchIframeZoom(frameId, btn) {
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

function toggleFullscreen(frameId, btn) {
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
		document.dispatchEvent(new Event('map-fullscreen'));
		btn.textContent = '[-]';
		// unlock interactivity: drop the overlay gate
		if (overlay) overlay.style.display = 'none';
		// show [R] in the top bar to reset the map to default without leaving
		// fullscreen; it reloads and stays available for repeated use
		if (resetBtn) setResetButtonToFullscreenReset(resetBtn);
	}
}

function exitFullscreen(if1) {
	if1.classList.remove('fullscreen');
	const title = if1.previousElementSibling;
	title.classList.remove('fullscreen');
	const btn = title.querySelector('.fs-btn');
	if (btn) btn.textContent = '[ ]';
	if (![...document.querySelectorAll('.if1.fullscreen')].some(f => !f.closest('.map-block.snapped')))
		document.body.classList.remove('fs-lock');
	document.dispatchEvent(new Event('map-fullscreen'));
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
function hideOverlayOnDoubleTap() {
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

function updateHintText() {
	const isMobile = window.innerWidth < 800;
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

// reload the map to its default position/zoom without changing the button —
// used while in fullscreen, where reset must stay available for repeated use
function resetIframePosition(frameId) {
	dlog(`resetIframePosition: ${frameId}`);
	setIframeSrc(document.getElementById(frameId));
}

function setResetButtonToFullscreenReset(resetFrame) {
	dlog(`setResetButtonToFullscreenReset: ${resetFrame.id}`);
	const newResetFrame = resetFrame.cloneNode(true);
	resetFrame.parentNode.replaceChild(newResetFrame, resetFrame);

	newResetFrame.addEventListener('click', (e) => {
		e.stopPropagation(); // Stop event bubbling
		resetIframePosition(getFrameIdFromResetButtonId(newResetFrame.id));
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

function GetLastInit() {
	let dt = new Date();
	// normalize date to last 12h or 00h
	dt = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), (dt.getUTCHours() >= 12 ? 12 : 0), 0, 0, 0));
	return dt;
};

function DTGFromDateInHours(mydate) {
	const result = mydate.getUTCFullYear().toString() + pad(mydate.getUTCMonth() + 1, 2) + pad(mydate.getUTCDate(), 2) + pad(mydate.getUTCHours(), 2);
	return result;
};

function EndValue(mydate) {
	const result = mydate.getUTCFullYear().toString() + pad(mydate.getUTCMonth() + 1, 2) + pad(mydate.getUTCDate(), 2) + "06";
	return result;
};

function pad(n, width, z) {
	return String(n).padStart(width, z || '0');
};

const isDebugEnabled = new URLSearchParams(window.location.search).get('debug') === '1';

function dlog(...args) {
	if (isDebugEnabled)
		console.log(...args);
}

// ---------- dialogs ----------

// Two of them — the maps picker (maps.js) and the manual — over one set of
// chrome: a fixed panel above everything, dismissed by a press outside, the
// page held still underneath, and on desktop a window, dragged by its head and
// resized from any side or corner, each remembering where it was put under the
// key its element names (data-dialog-key). The chrome sits here and not in
// maps.js because the landing page carries the manual too and loads neither
// maps.js nor popout.js.
//
// One stands at a time: opening one shuts the other, so there is a single
// backdrop, a single scroll lock and a single Escape to reason about.

const DIALOG_MQ = window.matchMedia('(min-width: 801px) and (hover: hover) and (pointer: fine)');
const DIALOG_MIN_WIDTH = 360;
const DIALOG_MIN_HEIGHT = 120;
const DIALOG_MARGIN = 8; // kept free of the viewport edge when sizing
const DIALOG_HANDLES = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

// the scrollbar the lock takes away, held in its place for as long as a dialog
// stands (html.ms-gutter) so nothing centred on the page shifts under it. It
// can only be measured while it is still there, so it is taken when the first
// dialog opens and kept until the last one shuts. popout.js reads it through
// dialogGutterPx() rather than by name: this file runs after that one, and a
// call made before it does gets the 0 that is true of a page with no dialog up
let dialogGutter = 0;

function dialogGutterPx() {
	return dialogGutter;
}

function dialogViewportWidth() {
	return document.documentElement.clientWidth - dialogGutter;
}

function dialogViewportHeight() {
	return document.documentElement.clientHeight;
}

function dialogClamp(value, min, max) {
	return Math.min(Math.max(value, min), Math.max(min, max));
}

function dialogFraction(n) {
	return Math.round(n * 10000) / 10000;
}

function dialogPanels() {
	return [...document.querySelectorAll('.map-settings')];
}

function openDialogPanel() {
	return dialogPanels().find(panel => !panel.hidden) || null;
}

function anyDialogOpen() {
	return !!openDialogPanel();
}

// ---------- where and how big a dialog was put ----------

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
	try {
		const stored = JSON.parse(localStorage.getItem(key));
		if (!stored || typeof stored !== 'object') return null;
		if (!Number.isFinite(stored.left) || !Number.isFinite(stored.top) || !(stored.width > 0)) return null;
		return { left: stored.left, top: stored.top, width: stored.width, height: stored.height > 0 ? stored.height : null };
	} catch (e) {
		return null;
	}
}

function saveDialogGeometry(panel) {
	const key = dialogStorageKey(panel);
	if (!key) return;
	const rect = panel.getBoundingClientRect();
	const stored = {
		left: dialogFraction(rect.left / dialogViewportWidth()),
		top: dialogFraction(rect.top / dialogViewportHeight()),
		width: Math.round(rect.width)
	};
	if (panel.style.height) stored.height = Math.round(rect.height); // only once resized; else the CSS's
	try {
		localStorage.setItem(key, JSON.stringify(stored));
	} catch (e) { /* storage disabled or full — the dialog still moves this session */ }
}

function forgetDialogGeometry(panel) {
	const key = dialogStorageKey(panel);
	if (!key) return;
	try {
		localStorage.removeItem(key);
	} catch (e) { /* nothing stored is nothing to drop */ }
}

function dialogMaxWidth() {
	return Math.max(DIALOG_MIN_WIDTH, dialogViewportWidth() - DIALOG_MARGIN * 2);
}

function dialogMaxHeight() {
	return Math.max(DIALOG_MIN_HEIGHT, dialogViewportHeight() - DIALOG_MARGIN * 2);
}

// height null leaves it the CSS's. The CSS's max-height assumes the top the
// CSS set, and the dialog may be anywhere now, so it is recomputed from where
// the top is asked to be; the top is then held to the height that gave
function placeDialog(panel, left, top, width, height) {
	width = dialogClamp(width, DIALOG_MIN_WIDTH, dialogMaxWidth());
	panel.style.width = `${Math.round(width)}px`;
	panel.style.maxWidth = 'none';
	panel.style.right = 'auto'; // off the centring
	panel.style.margin = '0';
	if (height === null) {
		panel.style.height = '';
		panel.style.maxHeight = `${Math.round(Math.max(DIALOG_MIN_HEIGHT, dialogViewportHeight() - Math.max(0, top) - DIALOG_MARGIN))}px`;
	} else {
		panel.style.maxHeight = 'none';
		panel.style.height = `${Math.round(dialogClamp(height, DIALOG_MIN_HEIGHT, dialogMaxHeight()))}px`;
	}
	panel.style.left = `${Math.round(dialogClamp(left, 0, Math.max(0, dialogViewportWidth() - panel.offsetWidth)))}px`;
	panel.style.top = `${Math.round(dialogClamp(top, 0, Math.max(0, dialogViewportHeight() - panel.offsetHeight)))}px`;
}

function clearDialog(panel) {
	['left', 'top', 'width', 'height', 'maxWidth', 'maxHeight', 'right', 'margin'].forEach(prop => panel.style[prop] = '');
}

// on open, and on a window resize, so it cannot be stranded off screen. A phone
// gets the dialog the CSS draws, as it gets no widgets
function applyStoredDialog(panel) {
	if (!panel || panel.hidden) return;
	const stored = DIALOG_MQ.matches ? loadDialogGeometry(panel) : null;
	if (!stored) { clearDialog(panel); return; }
	placeDialog(panel, stored.left * dialogViewportWidth(), stored.top * dialogViewportHeight(), stored.width, stored.height);
}

// a pointer gesture on a dialog: move and up on document, since nothing moves
// in the DOM. It is the widgets' gesture without their concerns — no shadows to
// keep up with, and no Shift, which a dialog has no aspect to hold
function trackDialogPointer(e, onMove, onEnd) {
	const startX = e.clientX, startY = e.clientY;
	const move = (ev) => onMove(ev.clientX - startX, ev.clientY - startY, ev);
	const stop = () => {
		document.removeEventListener('pointermove', move);
		document.removeEventListener('pointerup', stop);
		document.removeEventListener('pointercancel', stop);
		document.body.classList.remove('po-dragging');
		if (onEnd) onEnd();
	};
	document.body.classList.add('po-dragging');
	document.addEventListener('pointermove', move);
	document.addEventListener('pointerup', stop);
	document.addEventListener('pointercancel', stop);
}

// the widgets' own handles, inside the panel so the press that grabs one is a
// press inside the dialog and misses the backdrop that would shut it. Built
// again rather than kept, for the picker, whose body is rebuilt on every open
function buildDialogHandles(panel) {
	panel.querySelectorAll(':scope > .po-h').forEach(handle => handle.remove());
	DIALOG_HANDLES.forEach(dir => {
		const handle = document.createElement('div');
		handle.className = `po-h po-h-${dir}`;
		handle.dataset.dir = dir;
		panel.appendChild(handle);
	});
}

// one listener per panel, which outlives the rebuild its children do not
function initDialogWindow(panel) {
	panel.addEventListener('pointerdown', (e) => {
		if (e.button !== 0 || !DIALOG_MQ.matches) return;
		const handle = e.target.closest('.po-h');
		// the head is the grip, but a link or a button on it is itself
		const head = !handle && e.target.closest('.ms-head') && !e.target.closest('a, button, input');
		if (!handle && !head) return;
		e.preventDefault();
		const start = panel.getBoundingClientRect();
		const dir = handle ? handle.dataset.dir : null;
		const kept = panel.style.height ? start.height : null; // a drag leaves the height as it was found
		let moved = false;
		trackDialogPointer(e, (dx, dy) => {
			if (!moved && !dx && !dy) return; // a press that never moved stores nothing
			moved = true;
			if (!dir) {
				placeDialog(panel, start.left + dx, start.top + dy, start.width, kept);
				return;
			}
			let width = start.width, height = start.height;
			if (dir.includes('e')) width = start.width + dx;
			if (dir.includes('w')) width = start.width - dx;
			if (dir.includes('s')) height = start.height + dy;
			if (dir.includes('n')) height = start.height - dy;
			// clamped here as well as in placeDialog, so the edge that stays put does
			width = dialogClamp(width, DIALOG_MIN_WIDTH, dialogMaxWidth());
			height = dialogClamp(height, DIALOG_MIN_HEIGHT, dialogMaxHeight());
			placeDialog(panel, dir.includes('w') ? start.right - width : start.left,
				dir.includes('n') ? start.bottom - height : start.top, width, height);
		}, () => { if (moved) saveDialogGeometry(panel); });
	});
	// the way back to the dialog the CSS draws, the head's spare gesture
	panel.addEventListener('dblclick', (e) => {
		if (!DIALOG_MQ.matches || !e.target.closest('.ms-head') || e.target.closest('a, button, input')) return;
		clearDialog(panel);
		forgetDialogGeometry(panel);
	});
}

// ---------- opening and shutting ----------

// the page's own state, read off whichever dialogs are up rather than set by
// the one being opened: with two of them, a dialog shutting to let another
// stand must not take the lock, the gutter or the backdrop away with it
function syncDialogChrome() {
	const open = anyDialogOpen();
	if (open && !document.documentElement.classList.contains('ms-gutter')) {
		const scrollbar = window.innerWidth - document.documentElement.clientWidth;
		if (scrollbar > 0) {
			dialogGutter = scrollbar;
			document.documentElement.classList.add('ms-gutter');
		}
	} else if (!open) {
		dialogGutter = 0;
		document.documentElement.classList.remove('ms-gutter');
	}
	document.body.classList.toggle('ms-open', open);
	const backdrop = document.querySelector('.ms-backdrop');
	if (backdrop) {
		backdrop.hidden = !open;
		if (open) backdrop.classList.remove('ms-spent'); // it paints again for a dialog that is back
	}
	// the columns and the widgets measure against a viewport the gutter changed
	if (typeof layoutSnapColumns === 'function') layoutSnapColumns();
}

// every change of state is announced, the one made room for as much as the one
// asked for: a dialog shut to let another stand is still shut, and what hangs
// off that — the Karte button's arrow, the manual's hash — has no other way of
// hearing about it
function notifyDialog(panel, visible) {
	document.dispatchEvent(new CustomEvent('dialog-toggled', { detail: { panel, visible } }));
}

function setDialogVisible(panel, visible) {
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

function toggleDialog(panel) {
	if (!panel) return;
	setDialogVisible(panel, panel.hidden);
}

function closeOpenDialog() {
	const panel = openDialogPanel();
	if (panel) setDialogVisible(panel, false);
	return !!panel;
}

// A press anywhere outside the dialog shuts it, dropping what was edited in it
// (the picker is rebuilt from what is stored on the next open). The press lands
// on the backdrop, which is over everything the dialog is over, so it shuts the
// dialog and does nothing else: it follows no link, presses no button, takes no
// widget. The tab stands above the backdrop and keeps its own click, which
// shuts the dialog the same way.
//
// A press is a pointerdown, a release and a click, and all three belong to the
// dismissal: the backdrop stands until the click has been taken, so none of
// them can be completed on what the dialog was covering. It stops painting the
// moment it is pressed, the dialog it dimmed for being on its way out, and the
// click is swallowed in the capture phase, which is ahead of every listener on
// the page whatever order they were bound in. The release arms a short fallback
// for the gestures no click follows — a pointer let go outside the window, a
// drag
function initDialogBackdrop() {
	const backdrop = document.querySelector('.ms-backdrop');
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

// Escape shuts whichever dialog is up, wherever the keyboard is — not from a
// text field, whose own Escape (the find box, the preset name editors) is a way
// out of the field first
document.addEventListener('keydown', (e) => {
	if (e.key !== 'Escape' || e.altKey || e.ctrlKey || e.metaKey) return;
	if (e.target.matches && e.target.matches('input:not([type="radio"]):not([type="checkbox"]), textarea, [contenteditable]')) return;
	closeOpenDialog();
});

// ---------- the manual ----------

// MANUAL.md, converted at build time (md.ps1) and built into both pages. It is
// a dialog and not a page of its own so it can be read beside the maps it
// describes rather than in place of them — which costs it the address a page
// would have had, so #upute stands in: it opens the dialog on load, and the
// dialog puts it there and takes it away again, which keeps "read this" a link
// anyone can send.
const MANUAL_HASH = 'upute';

// the manual is off for now: false hides the ? button and the footer's Upute
// and leaves H and #upute alone; true brings it all back. The class goes on
// before the first paint, as board-boot does, so nothing flashes up and away
const MANUAL_ENABLED = false;
if (!MANUAL_ENABLED) document.documentElement.classList.add('no-manual');

function manualDialog() {
	return document.getElementById('manualDialog');
}

function manualOpen() {
	const panel = manualDialog();
	return !!panel && !panel.hidden;
}

function toggleManual() {
	toggleDialog(manualDialog());
}

// replaceState rather than the hash itself: assigning to location.hash stacks
// an entry for every open, so Back would walk out through them one at a time
function syncManualHash(open) {
	const url = new URL(window.location.href);
	const already = decodeURIComponent(url.hash.slice(1)) === MANUAL_HASH;
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

function initManual() {
	const panel = manualDialog();
	if (!panel || !MANUAL_ENABLED) return;

	const close = panel.querySelector('.ms-close');
	if (close) close.addEventListener('click', () => setDialogVisible(panel, false));

	panel.addEventListener('click', (e) => {
		const link = e.target.closest('a[href^="#"]');
		if (!link || !panel.contains(link)) return;
		e.preventDefault();
		scrollManualTo(panel, decodeURIComponent(link.getAttribute('href').slice(1)));
	});

	document.addEventListener('dialog-toggled', (e) => {
		if (e.detail.panel !== panel) return;
		syncManualHash(e.detail.visible);
		if (e.detail.visible) panel.querySelector('.ms-body').scrollTop = 0;
	});

	// H for help: the letters name the thing, as R, G and S do, and ? would
	// need Shift on one layout and AltGr on the next
	document.addEventListener('keydown', (e) => {
		if ((e.key !== 'h' && e.key !== 'H') || e.altKey || e.ctrlKey || e.metaKey) return;
		if (e.target.matches && e.target.matches('input:not([type="radio"]):not([type="checkbox"]), textarea, [contenteditable]')) return;
		e.preventDefault();
		toggleManual();
	});

	// the address, on arrival and whenever it is edited afterwards
	const fromHash = () => {
		const wanted = decodeURIComponent(window.location.hash.slice(1)) === MANUAL_HASH;
		if (wanted !== manualOpen()) setDialogVisible(panel, wanted);
	};
	window.addEventListener('hashchange', fromHash);
	fromHash();
}

function initDialogs() {
	dialogPanels().forEach(panel => {
		buildDialogHandles(panel);
		initDialogWindow(panel);
	});
	initDialogBackdrop();
	initManual();
	window.addEventListener('resize', () => applyStoredDialog(openDialogPanel()));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDialogs);
else initDialogs();

// wiring for content inside the maps tbody; called on load and again after
// maps.js re-renders it, so it must only touch freshly created nodes
function initDynamicContent() {
	document.querySelectorAll('img.lazy').forEach(img => {
		img.src = img.getAttribute('data-src');
		img.classList.remove('lazy');
	});
	addSwipeEvents();
	previousWidth = 0; // force updateIframeSrc to run for newly rendered iframes
	updateIframeSrc();
	hideOverlayOnDoubleTap();
	updateHintText();
	addLinksScrollShadows();
	showProgress();
}

document.addEventListener('DOMContentLoaded', () => {
	initLinksBottom();
	initDynamicContent();
	addExpandableClickEventListener();
});

window.addEventListener('resize', () => {
	clearTimeout(window._resizeTimeout); // Optional: debounce to avoid excessive reloads
	window._resizeTimeout = setTimeout(() => {
		updateIframeSrc();
		updateHintText();
		updateLinksScrollShadows();
	}, 200);
});
