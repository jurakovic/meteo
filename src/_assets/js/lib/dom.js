// Small DOM helpers shared by every part of the site.

// an element with attributes and children in one call. `text` sets the text,
// `html` the markup; an attribute that is undefined, null or false is left off
/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {Record<string, string | number | boolean | null | undefined>} [attrs]
 * @param {(Node | null | undefined | false)[]} [children]
 * @returns {HTMLElementTagNameMap[K]}
 */
export function el(tag, attrs = {}, children = []) {
	const node = document.createElement(tag);
	for (const [key, value] of Object.entries(attrs)) {
		if (value === undefined || value === null || value === false) continue;
		if (key === 'text') node.textContent = String(value);
		else if (key === 'html') node.innerHTML = String(value);
		else node.setAttribute(key, String(value));
	}
	for (const child of children) {
		if (child) node.appendChild(child);
	}
	return node;
}

// fn once the document is parsed: at once when it already is (dev, where the
// scripts are deferred modules), on DOMContentLoaded when it is not (the built
// page, where they are inlined into <head>). Each call is a step of its own: a
// throw in one is reported and the others still run
/** @param {() => void} fn */
export function onReady(fn) {
	const run = () => {
		try {
			fn();
		} catch (error) {
			reportError(error);
		}
	};
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
	else run();
}

// whether a key pressed here belongs to a text field, whose own keys (Escape
// out of it, Enter to commit, letters to type) come before the page's shortcuts
/** @param {EventTarget | null} target */
export function isTextField(target) {
	const node = /** @type {Element | null} */ (target);
	return !!node && typeof node.matches === 'function'
		&& node.matches('input:not([type="radio"]):not([type="checkbox"]), textarea, [contenteditable]');
}

// confirms a copy in place, since the panel has no other feedback channel
/** @param {Node} node @param {string} text @param {string} restore */
export function flashLabel(node, text, restore) {
	node.textContent = text;
	setTimeout(() => { node.textContent = restore; }, 1500);
}

// a number the stylesheet defines on :root (a z-index layer), fallback while
// there is none to read (no stylesheet yet, a test without a DOM)
/** @param {string} name @param {number} fallback @returns {number} */
export function cssNumber(name, fallback) {
	const value = typeof getComputedStyle === 'function'
		? Number(getComputedStyle(document.documentElement).getPropertyValue(name).trim())
		: NaN;
	return Number.isFinite(value) && value > 0 ? value : fallback;
}

// the elements a selector matches, as an array: the page's markup is HTML,
// so they are typed as HTML elements, with their style and dataset
/** @param {string} selector @param {ParentNode} [root] @returns {HTMLElement[]} */
export function queryAll(selector, root = document) {
	return /** @type {HTMLElement[]} */ ([...root.querySelectorAll(selector)]);
}

// the first element a selector matches, or null; typed as queryAll's are
/** @param {string} selector @param {ParentNode} [root] @returns {HTMLElement | null} */
export function query(selector, root = document) {
	return /** @type {HTMLElement | null} */ (root.querySelector(selector));
}
