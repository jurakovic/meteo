// The links: the list at the foot of the page (Linkovi), the row under each
// map and its switch, and the scrolling to either.

import { readJson, STORAGE_KEYS, writeJson } from '../lib/storage.js';

export function scrollToTop() {
	window.scrollTo({
		top: 0,
		behavior: 'smooth'
	});
}

export function scrollToElement(id) {
	const element = document.getElementById(id);
	if (element) {
		element.scrollIntoView({
			behavior: 'smooth',
			block: 'start'
		});
	}
}

export function addExpandableClickEventListener() {
	const expandable = document.querySelector(".expandable");
	expandable.addEventListener("click", function () {
		let arrow = this.querySelector(".arrow");
		const content = document.querySelector(".links");
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

export function toggleLinksBottom(checkbox) {
	document.body.classList.toggle('show-links-bottom', checkbox.checked);
	writeJson(STORAGE_KEYS.linksBottom, checkbox.checked ? 1 : 0); // "1" or "0", as it always was
	updateLinksScrollShadows();
}

export function initLinksBottom() {
	const checkbox = document.querySelector('.links-toggle');
	if (!checkbox) return;
	checkbox.checked = readJson(STORAGE_KEYS.linksBottom) === 1;
	document.body.classList.toggle('show-links-bottom', checkbox.checked);
}

export function updateLinksScrollShadow(bar) {
	const max = bar.scrollWidth - bar.clientWidth;
	const left = bar.scrollLeft;
	bar.classList.toggle('can-scroll-left', left > 1);
	bar.classList.toggle('can-scroll-right', max > 1 && left < max - 1);
}

export function updateLinksScrollShadows() {
	document.querySelectorAll('.links-bottom').forEach(updateLinksScrollShadow);
}

export function addLinksScrollShadows() {
	document.querySelectorAll('.links-bottom').forEach(bar => {
		bar.addEventListener('scroll', () => updateLinksScrollShadow(bar), { passive: true });
	});
	updateLinksScrollShadows();
}
