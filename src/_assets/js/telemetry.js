// Usage counts and script errors, sent to the worker when the page is hidden:
// no cookies, nothing stored, no id. See INTERNALS.md, Telemetry.

import { dlog, isDebugEnabled } from './lib/debug.js';

const TELEMETRY_URL = 'https://meteo-data.jurakovic.workers.dev/t';
// dev, the nginx containers and the e2e suite's meteo.test send nothing
const LIVE_HOST = 'jurakovic.github.io';
// a loop throwing on every frame is a few reports, not thousands
const MAX_ERRORS = 5;

/** @typedef {{ name: string, value: string, n: number }} TelemetryEvent */
/** @typedef {{ page: string, events: TelemetryEvent[] }} TelemetryReport */

/** @type {Map<string, number>} [name, value] as JSON → times since the last report */
const counts = new Map();
let errors = 0;
let page = ''; // empty until initTelemetry, and off the live site without ?debug=1
let sending = false; // the live site only; ?debug=1 elsewhere counts and logs

// counted only once initTelemetry has run on the live site, or with ?debug=1
/** @param {string} name @param {string} [value] */
export function track(name, value = '') {
	if (!page) return;
	const key = JSON.stringify([name, String(value)]);
	counts.set(key, (counts.get(key) || 0) + 1);
	dlog('telemetry:', name, value);
}

/** @param {unknown} message @param {string} where */
function trackError(message, where) {
	if (errors >= MAX_ERRORS) return;
	errors++;
	track('error', `${String(message).slice(0, 160)} @ ${where}`);
}

// what was counted since the last report, emptied; null when there is nothing
/** @returns {TelemetryReport | null} */
export function takeReport() {
	if (!counts.size) return null;
	const events = [...counts].map(([key, n]) => {
		const [name, value] = JSON.parse(key);
		return { name, value, n };
	});
	counts.clear();
	return { page, events };
}

function sendReport() {
	const report = takeReport();
	if (!report) return;
	dlog(sending ? 'telemetry: sent' : 'telemetry: not sent (not the live site)', report);
	// a string goes as text/plain, a type that needs no CORS preflight
	if (sending) navigator.sendBeacon(TELEMETRY_URL, JSON.stringify(report));
}

/** @param {'landing' | 'customize'} name */
export function initTelemetry(name) {
	const live = window.location.hostname === LIVE_HOST && typeof navigator.sendBeacon === 'function';
	if (!live && !isDebugEnabled()) return;
	sending = live;
	page = name;
	dlog(`telemetry: counting on ${name}; a report is logged when the page is hidden`
		+ (live ? `, and sent to ${TELEMETRY_URL}` : ', not sent off the live site'));
	track('view');
	// the build inlines the script, so line:col point into the page's
	// minified script in docs/, not into a module
	window.addEventListener('error', (e) => trackError(e.message, `${e.lineno}:${e.colno}`));
	window.addEventListener('unhandledrejection', (e) => trackError(e.reason && e.reason.message || e.reason, 'promise'));
	// hidden is the last moment a mobile browser reliably gives the page; a tab
	// hidden and shown again reports again, with what was counted since
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') sendReport();
	});
}
