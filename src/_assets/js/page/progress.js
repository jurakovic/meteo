// The progress bar over the top of the page while the images load.

import { dlog } from '../lib/debug.js';
import { query } from '../lib/dom.js';

// the run in progress, so listeners left over from a superseded one stand
// down, and the hide it scheduled
let progressRun = 0;
let progressHideTimer = 0;

export function showProgress() {
	const images = document.querySelectorAll('img');
	const progressBar = query('.progress-bar');
	const progressContainer = query('.progress-container');
	// counted once each: an image already complete when this runs can still
	// have its own load event queued, and a reloaded one loads again
	const pending = new Set(images);

	// each invocation gets a token; listeners left over from a superseded run
	// (e.g. Primijeni clicked while images are still loading) bail out so they
	// can't move the shared bar or schedule a hide over the current run
	const runId = ++progressRun;

	// re-runnable after a re-render: reset the bar, show the container and
	// cancel a hide still pending from the previous run
	clearTimeout(progressHideTimer);
	progressBar.style.width = '0';
	progressContainer.style.removeProperty('display');

	// nothing to track (e.g. all maps unselected): hide the bar right away
	if (images.length === 0) {
		progressContainer.style.display = 'none';
		return;
	}

	/** @param {HTMLImageElement} img */
	const settle = (img) => {
		if (progressRun !== runId || !pending.delete(img)) return;
		progressBar.style.width = `${((images.length - pending.size) / images.length) * 100}%`;
		if (pending.size === 0) {
			progressHideTimer = setTimeout(() => { progressContainer.style.display = 'none'; }, 500);
		}
	};

	images.forEach((img) => {
		img.addEventListener('load', () => settle(img));
		// a failed image counts as done, or the bar would never finish
		img.addEventListener('error', () => {
			dlog(`Error loading image: ${img.src}`);
			img.removeAttribute('src'); // no broken-image icon
			settle(img);
		});
		// already there: its load has been and gone. Dispatched rather than
		// settled directly, since a widget refits on its map's load
		// (widgets/responsive.js)
		if (img.complete) img.dispatchEvent(new Event('load'));
	});
}
