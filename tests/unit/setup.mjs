// What the site's modules touch of the browser as they are imported, and
// localStorage, stubbed so their pure functions can be tested under Node.
const store = new Map();
globalThis.localStorage = {
	getItem: (key) => (store.has(key) ? store.get(key) : null),
	setItem: (key, value) => { store.set(key, String(value)); },
	removeItem: (key) => { store.delete(key); },
	clear: () => store.clear()
};
globalThis.window = {
	matchMedia: () => ({ matches: true, addEventListener() {} }),
	location: { search: '', href: 'http://localhost/customize/index.html' },
	innerWidth: 1400
};
