// The slideshows: arrows, indicators, swipe and mouse drag.

import { query, queryAll } from '../lib/dom.js';

// n slides on from the one showing, wrapping round at either end
/** @param {HTMLElement} slideshow @param {number} n */
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
	const indicatorsContainer = query(`.indicators-container[data-slideshow-id='${slideshowId}']`);
	const activeSlide = query('.slide.active .placeholder', slideshow);
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
	queryAll('.slideshow:not([data-swipe])').forEach(slideshow => {
		slideshow.setAttribute('data-swipe', '');
		// an image's own drag would take the gesture
		slideshow.querySelectorAll('img').forEach(img => {
			img.addEventListener('dragstart', (e) => e.preventDefault());
		});
		bindTouchSwipe(slideshow);
		guardArrowsFromPinch(slideshow);
		bindMouseSwipe(slideshow);
	});
}

// a gesture from start to end changes the slide only when it went more across
// than up or down — otherwise it was the page being scrolled
function swipeIfHorizontal(slideshow, start, end) {
	if (Math.abs(end.x - start.x) > Math.abs(end.y - start.y)) handleSwipe(slideshow, start.x, end.x);
}

// one finger only: a second (a pinch-zoom) calls the swipe off
function bindTouchSwipe(slideshow) {
	let start = null, end = null, swiping = false;
	slideshow.addEventListener('touchstart', (e) => {
		swiping = false;
		if (e.touches.length > 1) return;
		start = end = { x: e.touches[0].clientX, y: e.touches[0].clientY };
	});
	slideshow.addEventListener('touchmove', (e) => {
		if (e.touches.length > 1 || !start) { swiping = false; return; }
		end = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		if (Math.abs(end.x - start.x) > Math.abs(end.y - start.y)) swiping = true;
	});
	slideshow.addEventListener('touchend', () => {
		if (swiping) swipeIfHorizontal(slideshow, start, end);
	});
}

// A two-finger touch still synthesizes a click on an arrow under it, so the
// click is cancelled whenever more than one finger was involved in the
// gesture: a pinch-zoom must not change the slide
function guardArrowsFromPinch(slideshow) {
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
}

// the same gesture with the mouse, on a desktop; leaving the slideshow calls it off
function bindMouseSwipe(slideshow) {
	let start = null;
	slideshow.addEventListener('mousedown', (e) => {
		start = { x: e.clientX, y: e.clientY };
	});
	slideshow.addEventListener('mouseup', (e) => {
		if (!start) return;
		swipeIfHorizontal(slideshow, start, { x: e.clientX, y: e.clientY });
		start = null;
	});
	slideshow.addEventListener('mouseleave', () => {
		start = null;
	});
}
