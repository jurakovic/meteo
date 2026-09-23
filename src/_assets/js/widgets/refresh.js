import { dlog } from '../lib/debug.js';
import { emit, EVENTS } from '../lib/events.js';
import { readJson, STORAGE_KEYS, writeJson } from '../lib/storage.js';
import { reloadAllMaps } from './reload.js';

// Images go stale on a page left open, and on a board left running for the
// room to glance at they are the whole point. This re-fetches what [R] does,
// on an interval — off until it is asked for, and a way of working rather than
// part of the view, so it travels in neither a preset nor a link and keeps the
// same footing as the grid switches.
export const REFRESH_CHOICES = [5, 10, 15, 30, 60];

const REFRESH_DEFAULT = 5;

function loadRefreshPrefs() {
	const stored = readJson(STORAGE_KEYS.refresh);
	if (!stored || typeof stored !== 'object') return { on: false, minutes: REFRESH_DEFAULT };
	return {
		on: stored.on === true,
		minutes: REFRESH_CHOICES.includes(stored.minutes) ? stored.minutes : REFRESH_DEFAULT
	};
}

let { on: refreshOn, minutes: refreshMinutes } = loadRefreshPrefs();

let refreshDeadline = 0;

let refreshTicker = 0;

export function isRefreshOn() {
	return refreshOn;
}

export function refreshEveryMinutes() {
	return refreshMinutes;
}

// m:ss of what is left, which is what both labels read
export function refreshLabel() {
	if (!refreshOn || !refreshDeadline) return '';
	const left = Math.max(0, Math.ceil((refreshDeadline - Date.now()) / 1000));
	return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}

// counted off a deadline rather than by stepping a number down: a background
// tab throttles its timers to about one a minute, and a counter stepped down
// would lose exactly the time the page spent unattended — which is the page
// this is for. The clock starts over here, so every way of refreshing by hand
// (the key, the tab's [R], a widget's own) puts the interval back to full
export function restartRefresh() {
	clearInterval(refreshTicker);
	refreshTicker = 0;
	refreshDeadline = refreshOn ? Date.now() + refreshMinutes * 60000 : 0;
	if (refreshOn) refreshTicker = setInterval(refreshTick, 1000);
	emit(EVENTS.refreshTick);
}

function refreshTick() {
	if (!refreshOn) return;
	if (Date.now() >= refreshDeadline) reloadAllMaps(); // which sets the clock going again
	else emit(EVENTS.refreshTick);
}

export function setRefreshPrefs(on, minutes) {
	dlog(`setRefreshPrefs: on=${on} minutes=${minutes}`);
	refreshOn = on === true;
	refreshMinutes = REFRESH_CHOICES.includes(minutes) ? minutes : REFRESH_DEFAULT;
	writeJson(STORAGE_KEYS.refresh, { on: refreshOn, minutes: refreshMinutes });
	// the countdown hangs off the body, since the tab shows for it off the board
	document.body.classList.toggle('refresh-on', refreshOn);
	restartRefresh();
	emit(EVENTS.refreshChanged);
}

export function initRefresh() {
	document.body.classList.toggle('refresh-on', refreshOn);
	restartRefresh();
}
