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

	slideshow.style.maxWidth = activeSlide.style.maxWidth;
	indicatorsContainer.style.maxWidth = activeSlide.style.maxWidth;
}


function showProgress() {
	// Get all images on the page
	const images = document.querySelectorAll('img');
	const progressBar = document.querySelector('.progress-bar');
	let imagesLoaded = 0;

	// Update progress bar
	const updateProgress = () => {
		const percent = (imagesLoaded / images.length) * 100;
		progressBar.style.width = percent + '%';

		// Hide the progress bar when all images are loaded
		if (imagesLoaded === images.length) {
			setTimeout(() => {
				document.querySelector('.progress-container').style.display = 'none';
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

function addSwipeEvents() {
	const slideshows = document.querySelectorAll('.slideshow');

	slideshows.forEach(slideshow => {
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
	if (resetBtn.textContent === '[R]') resetBtn.style.display = 'none';
}

function toggleFullscreen(frameId, btn) {
	dlog(`toggleFullscreen: ${frameId}`);
	const if1 = document.getElementById(frameId).parentElement;
	if (if1.classList.contains('fullscreen')) {
		exitFullscreen(if1);
	} else {
		if1.classList.add('fullscreen');
		if1.previousElementSibling.classList.add('fullscreen');
		document.body.classList.add('fs-lock');
		btn.textContent = '[-]';
		// unlock interactivity: drop the overlay gate and hide the reset button
		const overlay = if1.querySelector('.overlay');
		if (overlay) overlay.style.display = 'none';
		const resetBtn = getResetButtonFromFrameId(frameId);
		if (resetBtn) resetBtn.style.display = 'none';
	}
}

function exitFullscreen(if1) {
	if1.classList.remove('fullscreen');
	const title = if1.previousElementSibling;
	title.classList.remove('fullscreen');
	const btn = title.querySelector('.fs-btn');
	if (btn) btn.textContent = '[ ]';
	if (!document.querySelector('.if1.fullscreen'))
		document.body.classList.remove('fs-lock');
	// re-gate the map and offer the reset ([R]) button, since fullscreen was interactive
	const frameId = if1.querySelector('iframe').id;
	const resetBtn = getResetButtonFromFrameId(frameId);
	if (resetBtn) resetBtn.style.removeProperty('display');
	restoreOverlay(frameId);
}

function hideOverlayOnDoubleTap() {
	const overlays = document.querySelectorAll('.if1 .overlay');

	overlays.forEach((overlay) => {
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

document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('img.lazy').forEach(img => {
		img.src = img.getAttribute('data-src');
		img.classList.remove('lazy');
	});
	showProgress();
	addExpandableClickEventListener();
	addSwipeEvents();
	updateIframeSrc();
	hideOverlayOnDoubleTap();
	updateHintText();
	initLinksBottom();
	addLinksScrollShadows();
});

window.addEventListener('resize', () => {
	clearTimeout(window._resizeTimeout); // Optional: debounce to avoid excessive reloads
	window._resizeTimeout = setTimeout(() => {
		updateIframeSrc();
		updateHintText();
		updateLinksScrollShadows();
	}, 200);
});

document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape')
		document.querySelectorAll('.if1.fullscreen').forEach(exitFullscreen);
});
