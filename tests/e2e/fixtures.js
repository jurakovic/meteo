// Shared test setup: every request leaving the local server is answered here
// (images as an SVG of a map's usual size, frames as an empty page, the remote
// map switch as a test chooses), and any script error on the page fails the test
import { test as base, expect } from '@playwright/test';

const IMAGE = `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="640"><rect width="880" height="640" fill="#3a6"/></svg>`;
const FRAME = '<!doctype html><title>frame</title><body style="background:#246"></body>';
const CONFIG_URL = 'https://meteo-data.jurakovic.workers.dev/config.json';

export const test = base.extend({
	paths: [{ landing: '/', customize: '/customize/index.html' }, { option: true }],

	// the remote config.json the page fetches; a test overrides it with test.use
	mapConfig: [{ maps: {} }, { option: true }],

	page: async ({ page, mapConfig }, use) => {
		const errors = [];
		page.on('pageerror', error => errors.push(error.message));
		await page.route(url => url.hostname !== 'localhostmeteo', route => {
			const request = route.request();
			if (request.url().startsWith(CONFIG_URL)) {
				return route.fulfill({ json: mapConfig, headers: { 'Access-Control-Allow-Origin': '*' } });
			}
			switch (request.resourceType()) {
				case 'image': return route.fulfill({ contentType: 'image/svg+xml', body: IMAGE });
				case 'document': return route.fulfill({ contentType: 'text/html', body: FRAME });
				default: return route.fulfill({ status: 404, body: '' });
			}
		});
		await use(page);
		expect(errors, 'script errors on the page').toEqual([]);
	}
});

export { expect };

// the ids of the maps the page shows, in order
export async function shownMapIds(page) {
	return page.locator('.map-block:not(.duplicate)').evaluateAll(blocks => blocks.map(b => b.dataset.mapId));
}

export async function storedJson(page, key) {
	return page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
}

// a pointer drag from one point to another, in steps so the page sees the moves
export async function drag(page, from, to, steps = 12) {
	await page.mouse.move(from.x, from.y);
	await page.mouse.down();
	await page.mouse.move(to.x, to.y, { steps });
	await page.mouse.up();
}

export async function box(locator) {
	const b = await locator.boundingBox();
	return { ...b, right: b.x + b.width, bottom: b.y + b.height, cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
}
