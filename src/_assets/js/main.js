
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

let slidePage = [2, 2, 2, 2, 1, 1, 1, 1];

function plusSlides(n, slideshowId) {
	showSlides(slidePage[slideshowId - 1] += n, slideshowId);
}

function showSlides(n, slideshowId) {
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
