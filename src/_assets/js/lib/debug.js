// Debug logging, on with ?debug=1 in the address.

const isDebugEnabled = new URLSearchParams(window.location.search).get('debug') === '1';

export function dlog(...args) {
	if (isDebugEnabled) console.log(...args);
}
