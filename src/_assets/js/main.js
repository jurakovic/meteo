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

async function addExpandableClickEventListener() {
	var expandable = document.getElementsByClassName("expandable")[0];
	expandable.addEventListener("click", function () {
		let arrow = this.querySelector(".arrow");
		var content = document.getElementsByClassName("links")[0];
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

let slidePage = [2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

function plusSlides(slideshowId, n) {
	showSlides(slideshowId, slidePage[slideshowId - 1] += n);
}

function showSlides(slideshowId, n) {
	const slides = document.querySelectorAll(`.slideshow[data-slideshow-id="${slideshowId}"] .slide`);
	const indicators = document.querySelectorAll(`.indicators-container[data-slideshow-id="${slideshowId}"] .indicator`);
	if (n > slides.length) { slidePage[slideshowId - 1] = 1; }
	if (n < 1) { slidePage[slideshowId - 1] = slides.length; }
	slides.forEach(slide => slide.classList.remove('active'));
	slides[slidePage[slideshowId - 1] - 1].classList.add('active');
	indicators.forEach(indicator => indicator.classList.remove('active'));
	indicators[slidePage[slideshowId - 1] - 1].classList.add('active');
	updateSlideshowWidth(slideshowId);
}

function updateSlideshowWidth(slideshowId) {
	if (slideshowId !== 16) return; // for now only essl and estofex have different widths

	const slideshow = document.querySelector(`.slideshow[data-slideshow-id='${slideshowId}']`);
	const indicatorsContainer = document.querySelector(`.indicators-container[data-slideshow-id='${slideshowId}']`);
	const activeSlide = slideshow.querySelector('.slide.active .placeholder');

	slideshow.style.maxWidth = activeSlide.style.maxWidth;
	indicatorsContainer.style.maxWidth = activeSlide.style.maxWidth;
}

window.addEventListener('load', function () {
	const lazyImages = document.querySelectorAll('img.lazy');

	lazyImages.forEach(img => {
		img.src = img.getAttribute('data-src');
		img.classList.remove('lazy');
	});
});

function showProgress() {
	// Get all images on the page
	const images = document.querySelectorAll('img');
	const progressBar = document.getElementsByClassName('progress-bar')[0];
	let imagesLoaded = 0;

	// Update progress bar
	const updateProgress = () => {
		const percent = (imagesLoaded / images.length) * 100;
		progressBar.style.width = percent + '%';

		// Hide the progress bar when all images are loaded
		if (imagesLoaded === images.length) {
			setTimeout(() => {
				document.getElementsByClassName('progress-container')[0].style.display = 'none';
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

function handleSwipe(slideshowId, startX, endX) {
	const threshold = 50;
	const distance = endX - startX;

	if (Math.abs(distance) > threshold) {
		if (distance > 0) {
			plusSlides(slideshowId, -1); // swipe right
		} else {
			plusSlides(slideshowId, 1); // swipe left
		}
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
		const slideshowId = slideshow.getAttribute('data-slideshow-id');

		// Prevent default drag behavior on images
		const images = slideshow.querySelectorAll('img');
		images.forEach(img => {
			img.addEventListener('dragstart', (e) => e.preventDefault());
		});

		// Touch events for mobile
		slideshow.addEventListener('touchstart', (e) => {
			startX = e.touches[0].clientX;
			startY = e.touches[0].clientY;
			isDragging = false;
		});

		slideshow.addEventListener('touchmove', (e) => {
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
					handleSwipe(slideshowId, startX, endX);
				}
			}
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
					handleSwipe(slideshowId, startX, endX);
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

let previousWidth = 0;

let zoomMap = new Map();
zoomMap.set('windy', [ '&zoom=7', '&zoom=6' ]);
zoomMap.set('blitzortung', [ '#6/', '#5/' ]);
zoomMap.set('weatherAndRadar', [ '&zoom=7.2', '&zoom=6.8' ]);
zoomMap.set('rainViewer', [ ',6.3&', ',5.8&' ]);
zoomMap.set('ventussky', [ ';6&', ';6&' ]);

function updateIframeSrc() {
	if (window.innerWidth !== previousWidth) {
		previousWidth = window.innerWidth;
		setIframeSrc('windy');
		setIframeSrc('blitzortung');
		setIframeSrc('weatherAndRadar');
		setIframeSrc('rainViewer');
		setIframeSrc('ventussky');
	}
}

function setIframeSrc(iframeId) {
	dlog(`Updating iframe src for ${iframeId}`);

	const iframe = document.getElementById(iframeId);
	if (iframe) {
		let values = zoomMap.get(iframeId);
		let zoomOld = values[0];
		let zoomNew = values[1];

		let url = iframe.getAttribute('data-src');

		if (window.innerWidth < 800)
			url = url.replace(zoomOld, zoomNew);

		iframe.src = url;
	}
	else {
		dlog(`${iframeId} not found, skipping updateIframeSrc for ${iframeId}`);
	}
}

function updateMeteoblueImgSrc() {
	setMeteoblueImgSrc('mbzg');
}

function setMeteoblueImgSrc(imgId) {
	dlog(`Updating meteoblue img src for ${imgId}`);

	const img = document.getElementById(imgId);
	if (img) {
		let url = img.getAttribute('data-src');
		let newTs = Math.floor(new Date().getTime()/1000.0).toString();
		url = url.replace('&ts=1762811837', `&ts=${newTs}`);
		img.src = url;
	}
	//else {
	//	dlog(`${iframeId} not found, skipping updateIframeSrc for ${iframeId}`);
	//}
}

function hideOverlayOnDoubleTap() {
	const overlays = document.querySelectorAll('.if1 .overlay');

	overlays.forEach((overlay) => {
		let lastTap = 0;

		overlay.addEventListener('dblclick', () => {
			overlay.style.display = 'none';
			let resetFrame = getResetButtonFromOverlayId(overlay.id);
			resetFrame.removeAttribute('style');
			setResetButtonToExit(resetFrame);
		});

		overlay.addEventListener('touchend', (e) => {
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
	setIframeSrc(frameId);

	const resetFrame = getResetButtonFromFrameId(frameId);
	resetFrame.style.display = 'none';
	setResetButtonToExit(resetFrame);
}

function getResetButtonFromFrameId(frameId) {
	return document.getElementById('reset' + String(frameId).charAt(0).toUpperCase() + String(frameId).slice(1) + 'Frame');
}

function getResetButtonFromOverlayId(overlayId) {
	return document.getElementById(overlayId.replace('overlay', 'reset'));
}

function getFrameIdFromResetButtonId(resetFrameId) {
	let name = resetFrameId.replace('reset', '').replace('Frame', '');
	return String(name).charAt(0).toLowerCase() + String(name).slice(1);
}

function setEsslImgSrc(tryCount = 1) {
	// src: https://www.stormforecast.eu/storm_script_2.js
	const esslImg = document.getElementById('essl');

	if (!esslImg) {
		dlog("essl img not found, skipping setEsslImgSrc");
		return;
	}

	let maxTryCount = 5;
	let dt = GetLastInit();

	if (tryCount > 1)
		dt.setUTCHours(dt.getUTCHours() - (12 * (tryCount - 1)));

	let dte = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate() + (dt.getUTCHours() === 12 ? 3 : 2), 0, 0, 0, 0));

	let dtg = DTGFromDateInHours(dt);
	let end = EndValue(dte);
	dlog("dtg: " + dtg);
	dlog("end: " + end);

	let esslSrc = `https://www.stormforecast.eu/map_images/models/archamos/${dtg.slice(0, 6)}/${dtg}/combi_paramcombi24_${dtg}_${end}.png`;
	//dlog(esslSrc);

	function errorHandler() {
		if (tryCount < maxTryCount) {
			dlog(`Image load failed, try attempt ${tryCount} with dtg: ${dtg}`);
			esslImg.removeEventListener('error', errorHandler);
			setEsslImgSrc(tryCount + 1);
		} else {
			dlog(`Image load failed after ${maxTryCount} attempts`);
			const noForecast = document.createElement('span');
			noForecast.innerHTML = "Nema prognoze za traženi period";
			esslImg.parentNode.appendChild(noForecast);
		}
	}

	esslImg.removeEventListener('error', errorHandler);
	esslImg.addEventListener('error', errorHandler);
	esslImg.src = esslSrc;
}

function GetLastInit() {
	let dt = new Date();
	// normalize date to last 12h or 00h
	dt = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), (dt.getUTCHours() >= 12 ? 12 : 0), 0, 0, 0));
	return dt;
};

function DTGFromDateInHours(mydate) {
	result = mydate.getUTCFullYear().toString() + pad(mydate.getUTCMonth() + 1, 2) + pad(mydate.getUTCDate(), 2) + pad(mydate.getUTCHours(), 2);
	return result;
};

function EndValue(mydate) {
	result = mydate.getUTCFullYear().toString() + pad(mydate.getUTCMonth() + 1, 2) + pad(mydate.getUTCDate(), 2) + "06";
	return result;
};

function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

let isDebugEnabled = false;

function getUrlParameter(name) {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(name);
}

if (getUrlParameter('debug') === '1') {
	isDebugEnabled = true;
}

function dlog(...args) {
	if (isDebugEnabled)
		console.log(...args);
}

document.addEventListener('DOMContentLoaded', () => {
	showProgress();
	addExpandableClickEventListener();
	addSwipeEvents();
	updateIframeSrc();
	updateMeteoblueImgSrc();
	hideOverlayOnDoubleTap();
	updateHintText();
	setEsslImgSrc();
});

window.addEventListener('resize', () => {
	clearTimeout(window._resizeTimeout); // Optional: debounce to avoid excessive reloads
	window._resizeTimeout = setTimeout(() => {
		updateIframeSrc();
		updateHintText();
	}, 200);
});
