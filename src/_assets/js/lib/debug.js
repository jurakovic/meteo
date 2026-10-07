// Debug logging, on with ?debug=1 in the address.

// read each time, so a test can set the address after importing this
export function isDebugEnabled() {
	return new URLSearchParams(window.location.search).get('debug') === '1';
}

export function dlog(...args) {
	if (isDebugEnabled()) console.log(...args);
}
