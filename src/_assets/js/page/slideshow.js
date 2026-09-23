// The slideshows: arrows, indicators, swipe and mouse drag.

// n slides on from the one showing, wrapping round at either end
export function plusSlides(slideshow, n) {
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

function handleSwipe(slideshow, startX, endX) {
	const threshold = 50;
	const distance = endX - startX;
	if (Math.abs(distance) > threshold) {
		const current = parseInt(slideshow.getAttribute('data-current-slide'));
		showSlides(slideshow, current + (distance > 0 ? -1 : 1));
	}
}

// bound once per slideshow: a copy made at runtime (widgets/copies.js) wires itself
// through here, and the sweep must pass over everything already bound rather
// than hang a second set of handlers on it
export function addSwipeEvents() {
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
