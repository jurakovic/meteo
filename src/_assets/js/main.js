
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
			behavior: 'smooth'
		});
	}
}

let slidePage = [2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

function plusSlides(slideshowId, n) {
	showSlides(slideshowId, slidePage[slideshowId - 1] += n);
}

function showSlides(slideshowId, n) {
	const slides = document.querySelectorAll(`.slideshow[data-slideshow-id="${slideshowId}"] .slide`);
	if (n > slides.length) { slidePage[slideshowId - 1] = 1; }
	if (n < 1) { slidePage[slideshowId - 1] = slides.length; }
	slides.forEach(slide => slide.classList.remove('active'));
	slides[slidePage[slideshowId - 1] - 1].classList.add('active');
}

window.addEventListener('load', function() {
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

document.addEventListener('DOMContentLoaded', showProgress);
