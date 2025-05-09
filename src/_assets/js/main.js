
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

let slidePage = [2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

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

function addSwipeEvents() {
	const slideshows = document.querySelectorAll('.slideshow');

	slideshows.forEach(slideshow => {
		let startX = 0;
		let endX = 0;
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
		});

		slideshow.addEventListener('touchmove', (e) => {
			endX = e.touches[0].clientX;
		});

		slideshow.addEventListener('touchend', () => {
			handleSwipe(slideshowId, startX, endX);
		});

		// Mouse events for desktop
		slideshow.addEventListener('mousedown', (e) => {
			startX = e.clientX;
			isDragging = true;
		});

		slideshow.addEventListener('mousemove', (e) => {
			if (isDragging) {
				endX = e.clientX;
			}
		});

		slideshow.addEventListener('mouseup', () => {
			if (isDragging) {
				handleSwipe(slideshowId, startX, endX);
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

document.addEventListener('DOMContentLoaded', showProgress);
document.addEventListener('DOMContentLoaded', addSwipeEvents);
