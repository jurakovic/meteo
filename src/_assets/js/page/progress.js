// The progress bar over the top of the page while the images load.

import { dlog } from '../lib/debug.js';

export function showProgress() {
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
