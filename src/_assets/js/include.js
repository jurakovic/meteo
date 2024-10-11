
function includeHTML() {
	const elements = document.querySelectorAll('[data-include-html]');
	elements.forEach(element => {
		const file = element.getAttribute('data-include-html');
		if (file) {
			fetch(file)
				.then(response => {
					if (!response.ok) throw new Error('Network response was not ok');
					return response.text();
				})
				.then(data => {
					element.innerHTML = data;
					element.removeAttribute('data-include-html');
					includeHTML(); // Recursive call to handle nested includes
				})
				.catch(error => console.error('Error fetching HTML fragment:', error));
		}
	});
}

document.addEventListener('DOMContentLoaded', includeHTML);

document.addEventListener('DOMContentLoaded', () => {
	// Get all images on the page
	const images = document.querySelectorAll('img');
	const progressBar = document.getElementById('progress-bar');
	let imagesLoaded = 0;

	// Update progress bar
	const updateProgress = () => {
		const percent = (imagesLoaded / images.length) * 100;
		progressBar.style.width = percent + '%';

		// Hide the progress bar when all images are loaded
		if (imagesLoaded === images.length) {
			setTimeout(() => {
				document.getElementById('progress-container').style.display = 'none';
			}, 1000); // Hide after a short delay
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
	});
});
