// Usage counts and script errors, sent to the worker every few minutes and
// when the page is hidden, while config.json switches it on: no cookies,
// nothing stored, no id. See INTERNALS.md, Telemetry.

import { dlog, isDebugEnabled } from './lib/debug.js';
import { EVENTS, on } from './lib/events.js';
import { isFeatureEnabled } from './remote-config.js';

const TELEMETRY_URL = 'https://meteo-data.jurakovic.workers.dev/t';
// dev, the nginx containers and the e2e suite's meteo.test send nothing
const LIVE_HOST = 'jurakovic.github.io';
// a loop throwing on every frame is a few reports, not thousands
const MAX_ERRORS = 5;
// a page that stays in view (a board on a second screen) reports as it goes;
// ?debug=1 sooner, so a test sees its report without waiting
const SEND_EVERY_MS = 3 * 60 * 1000;
const DEBUG_SEND_EVERY_MS = 10 * 1000;

/** @typedef {{ name: string, value: string, n: number }} TelemetryEvent */
/** @typedef {{ page: string, events: TelemetryEvent[] }} TelemetryReport */

/** @type {Map<string, number>} [name, value] as JSON → times since the last report */
const counts = new Map();
let errors = 0;
let page = ''; // empty until initTelemetry, and off the live site without ?debug=1
let live = false; // the only place a report is sent from
let viewCounted = false;

// once initTelemetry has run on the live site while the switch is on, or with
// ?debug=1 anywhere, which counts and logs whatever the switch says
function counting() {
	return !!page && (isFeatureEnabled('telemetry') || isDebugEnabled());
}

/** @param {string} name @param {string} [value] */
export function track(name, value = '') {
	if (!counting()) return;
	const key = JSON.stringify([name, String(value)]);
	counts.set(key, (counts.get(key) || 0) + 1);
	dlog('telemetry:', name, value);
}

/** @param {unknown} message @param {string} where */
function trackError(message, where) {
	if (!counting() || errors >= MAX_ERRORS) return;
	errors++;
	track('error', `${String(message).slice(0, 160)} @ ${where}`);
}

// what can be clicked: a <a> without href is how the page makes most of its
// buttons. A label isn't here: its click is passed on to its box, which is
const CLICKABLE = 'a, button, summary, [role="button"], input[type="checkbox"], input[type="radio"], [data-track]';

// a clicked element as [name, value]: a link by where it goes, anything else
// by its data-track name, or by tag.class when it has none, which ?debug=1
// shows as one still to name
/** @param {Element} target @returns {[string, string]} */
function clickEvent(target) {
	const name = target.getAttribute('data-track');
	if (name) return ['click', name];
	const href = target.tagName === 'A' ? target.getAttribute('href') : null;
	if (href) {
		// a jump within the page, or within a document in its dialog
		if (href.startsWith('#')) return ['link', href];
		// never the whole address, which on this site may carry a shared link
		const url = new URL(href, window.location.href);
		return ['link', url.origin === window.location.origin ? url.pathname : url.hostname];
	}
	const firstClass = target.classList[0];
	return ['click', target.tagName.toLowerCase() + (firstClass ? `.${firstClass}` : '')];
}

/** @param {MouseEvent} e @param {boolean} [linksOnly] */
function trackClick(e, linksOnly = false) {
	const target = e.target instanceof Element ? e.target.closest(CLICKABLE) : null;
	// a command counts itself, by its id, whether a click or a key ran it
	if (!target || target.closest('[data-action]')) return;
	const [name, value] = clickEvent(target);
	if (!linksOnly || name === 'link') track(name, value);
}

// what was counted since the last report, emptied; null when there is nothing.
// Errors go first: the worker keeps only a report's first events
/** @returns {TelemetryReport | null} */
export function takeReport() {
	if (!counts.size) return null;
	const events = [...counts].map(([key, n]) => {
		const [name, value] = JSON.parse(key);
		return { name, value, n };
	});
	counts.clear();
	events.sort((a, b) => Number(b.name === 'error') - Number(a.name === 'error'));
	return { page, events };
}

// a page switched on after it loaded (the file's fetch landing) is a view from then
function countView() {
	if (viewCounted || !counting()) return;
	viewCounted = true;
	track('view');
}

function sendReport() {
	const report = takeReport();
	if (!report) return;
	const sending = live && isFeatureEnabled('telemetry');
	dlog(sending ? 'telemetry: sent' : `telemetry: not sent (${live ? 'switched off' : 'not the live site'})`, report);
	// a string goes as text/plain, a type that needs no CORS preflight
	if (sending) navigator.sendBeacon(TELEMETRY_URL, JSON.stringify(report));
}

/** @param {'landing' | 'customize'} name */
export function initTelemetry(name) {
	live = window.location.hostname === LIVE_HOST && typeof navigator.sendBeacon === 'function';
	if (!live && !isDebugEnabled()) return;
	page = name;
	dlog(`telemetry: counting on ${name}; a report is logged every 10 s and when the page is hidden`
		+ (!live ? ', not sent off the live site'
			: isFeatureEnabled('telemetry') ? `, and sent to ${TELEMETRY_URL}` : ', not sent while switched off'));
	countView();
	// switched off, what was counted goes unsent; ?debug=1 keeps it to log
	on(EVENTS.featuresChanged, () => {
		if (isFeatureEnabled('telemetry')) countView();
		else if (!isDebugEnabled()) counts.clear();
	});
	// the build inlines the script, so line:col point into the page's
	// minified script in docs/, not into a module
	window.addEventListener('error', (e) => trackError(e.message, `${e.lineno}:${e.colno}`));
	window.addEventListener('unhandledrejection', (e) => trackError(e.reason && e.reason.message || e.reason, 'promise'));
	// captured on window, ahead of every listener on the page, so one that
	// stops a click can't keep it from being counted
	window.addEventListener('click', (e) => trackClick(e), true);
	// a middle click opens a link in a new tab and fires no click
	window.addEventListener('auxclick', (e) => { if (e.button === 1) trackClick(e, true); }, true);
	// hidden is the last moment a mobile browser reliably gives the page; a tab
	// hidden and shown again reports again, with what was counted since
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') sendReport();
	});
	// nothing counted since the last report, nothing sent
	setInterval(sendReport, isDebugEnabled() ? DEBUG_SEND_EVERY_MS : SEND_EVERY_MS);
}
