// Small DOM helpers shared by every part of the site.

// an element with attributes and children in one call. `text` sets the text,
// `html` the markup; an attribute that is undefined, null or false is left off
export function el(tag, attrs = {}, children = []) {
	const node = document.createElement(tag);
	for (const [key, value] of Object.entries(attrs)) {
		if (value === undefined || value === null || value === false) continue;
		if (key === 'text') node.textContent = value;
		else if (key === 'html') node.innerHTML = value;
		else node.setAttribute(key, value);
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
export function isTextField(target) {
	return !!target && typeof target.matches === 'function'
		&& target.matches('input:not([type="radio"]):not([type="checkbox"]), textarea, [contenteditable]');
}

// confirms a copy in place, since the panel has no other feedback channel
export function flashLabel(node, text, restore) {
	node.textContent = text;
	setTimeout(() => { node.textContent = restore; }, 1500);
}
