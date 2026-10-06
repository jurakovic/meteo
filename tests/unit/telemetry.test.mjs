// Telemetry: nothing off the live site without ?debug=1; on it, counts sent
// once the page is hidden
import './setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initTelemetry, takeReport, track } from '../../src/_assets/js/telemetry.js';

const sent = [];
const listeners = { window: new Map(), document: new Map() };
Object.defineProperty(globalThis, 'navigator', {
	configurable: true,
	value: { sendBeacon: (url, body) => { sent.push({ url, body: JSON.parse(body) }); return true; } }
});
globalThis.window.addEventListener = (type, handler) => listeners.window.set(type, handler);
globalThis.document = /** @type {any} */ ({
	visibilityState: 'visible',
	addEventListener: (type, handler) => listeners.document.set(type, handler)
});

function hide() {
	globalThis.document.visibilityState = 'hidden';
	listeners.document.get('visibilitychange')();
	globalThis.document.visibilityState = 'visible';
}

test('off the live site nothing is counted or listened for', () => {
	globalThis.window.location.hostname = 'meteo.test';
	initTelemetry('landing');
	track('command', 'zoom');
	assert.equal(takeReport(), null);
	assert.equal(listeners.document.size + listeners.window.size, 0);
});

test('on the live site a hidden page sends the counts since the last report', () => {
	globalThis.window.location.hostname = 'jurakovic.github.io';
	initTelemetry('customize');
	track('command', 'zoom');
	track('command', 'zoom');
	track('command', 'slide');
	hide();
	assert.equal(sent.length, 1);
	assert.equal(sent[0].url, 'https://meteo-data.jurakovic.workers.dev/t');
	assert.deepEqual(sent[0].body, {
		page: 'customize',
		events: [
			{ name: 'view', value: '', n: 1 },
			{ name: 'command', value: 'zoom', n: 2 },
			{ name: 'command', value: 'slide', n: 1 }
		]
	});

	hide(); // nothing counted since: nothing sent
	assert.equal(sent.length, 1);
	track('command', 'top');
	hide();
	assert.deepEqual(sent[1].body.events, [{ name: 'command', value: 'top', n: 1 }]);
});

test('errors are reported with where they were thrown, at most five', () => {
	const onError = listeners.window.get('error');
	for (let i = 0; i < 8; i++) onError({ message: 'boom', lineno: 3, colno: 14 });
	listeners.window.get('unhandledrejection')({ reason: new Error('late') });
	assert.deepEqual(takeReport().events, [{ name: 'error', value: 'boom @ 3:14', n: 5 }]);
});

test('errors go first in a report, ahead of what was counted before them', async () => {
	// a module instance of its own, with none of its five errors spent
	const fresh = await import('../../src/_assets/js/telemetry.js?order');
	globalThis.window.location.hostname = 'jurakovic.github.io';
	fresh.initTelemetry('customize');
	fresh.track('click', 'popout');
	listeners.window.get('error')({ message: 'boom', lineno: 1, colno: 2 });
	fresh.track('link', 'www.windy.com');
	assert.deepEqual(fresh.takeReport().events.map(e => e.name), ['error', 'view', 'click', 'link']);
});

test('with ?debug=1 off the live site the report is logged, not sent', async () => {
	// a module instance of its own, so the live one above does not carry over
	const fresh = await import('../../src/_assets/js/telemetry.js?debug');
	globalThis.window.location.hostname = 'localhost';
	globalThis.window.location.search = '?debug=1';
	const logged = [];
	const log = console.log;
	console.log = (...args) => logged.push(args);
	listeners.document.clear();
	try {
		fresh.initTelemetry('landing');
		fresh.track('command', 'zoom');
		const before = sent.length;
		hide();
		assert.equal(sent.length, before);
		const report = logged.find(args => args[0] === 'telemetry: not sent (not the live site)');
		assert.deepEqual(report[1], {
			page: 'landing',
			events: [{ name: 'view', value: '', n: 1 }, { name: 'command', value: 'zoom', n: 1 }]
		});
	} finally {
		console.log = log;
		globalThis.window.location.search = '';
	}
});
