
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

function updateIframeSrc() {
	if (window.innerWidth !== previousWidth) {
		const windyFrame = document.getElementById('windyFrame');
		const blitzortungFrame = document.getElementById('blitzortungFrame');

		let wurl = windyFrame.getAttribute('data-src');
		let burl = blitzortungFrame.getAttribute('data-src');

		if (window.innerWidth < 800) {
			wurl = wurl.replace('&zoom=7', '&zoom=6')
			burl = burl.replace('#6/', '#5/')
		}

		windyFrame.src = wurl;
		blitzortungFrame.src = burl;

		previousWidth = window.innerWidth;
	}
}

function hideOverlayOnDoubleTap() {
	const overlays = document.querySelectorAll('.if1 .overlay');

	overlays.forEach((overlay) => {
		let lastTap = 0;

		overlay.addEventListener('dblclick', () => {
			overlay.style.display = 'none';
		});

		overlay.addEventListener('touchend', (e) => {
			const currentTime = new Date().getTime();
			const tapLength = currentTime - lastTap;

			if (tapLength > 0 && tapLength < 200) {
				overlay.style.display = 'none';
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
			? "Dodirni dvaput za interaktivnu kartu"
			: "Dvostruki klik za interaktivnu kartu";
	});
}

function setEsslImgSrc() {
	// src: https://www.stormforecast.eu/storm_script_2.js
	let [dtg, end] = GetLastInit();
	let esslSrc = `https://www.stormforecast.eu/map_images/models/archamos/${dtg.slice(0, 6)}/${dtg}/combi_paramcombi24_${dtg}_${end}.png`;
	console.log("ESSL Image Source: " + esslSrc);

	const esslImg = document.getElementById('essl');
	esslImg.src = esslSrc;
}

function GetLastInit() {
	let dt = new Date();
	let buffer = 12;
	let h0 = 0 + buffer;
	let h12 = 12 + buffer;

	if (dt.getUTCHours() >= h12 || dt.getUTCHours() < h0) {
		dt.setUTCHours(12, 0, 0, 0);
		dt.setDate(dt.getDate() - 1);
	}
	else if (dt.getUTCHours() >= h0 && dt.getUTCHours() < h12) {
		dt.setUTCHours(0, 0, 0, 0);
	}

	let dtg = DTGFromDateInHours(dt);
	let end = EndValue(dt);
	return [dtg, end];
};

function DTGFromDateInHours(mydate) {
	result = mydate.getUTCFullYear().toString() + pad(mydate.getUTCMonth() + 1, 2) + pad(mydate.getUTCDate(), 2) + pad(mydate.getUTCHours(), 2);
	return result;
};

function EndValue(mydate) {
	result = mydate.getUTCFullYear().toString() + pad(mydate.getUTCMonth() + 1, 2) + pad(mydate.getUTCDate() + 3, 2) + pad(mydate.getUTCMonth() + 1, 2);
	return result;
};

function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

document.addEventListener('DOMContentLoaded', () => {
	showProgress();
	addExpandableClickEventListener();
	addSwipeEvents();
	updateIframeSrc();
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
