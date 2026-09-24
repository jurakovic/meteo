import { dlog } from '../lib/debug.js';
import { emit, EVENTS } from '../lib/events.js';
import { readJson, STORAGE_KEYS, writeJson } from '../lib/storage.js';
import { reloadAllMaps } from './reload.js';

// Auto-refresh: what [R] does, on an interval. See INTERNALS.md, Auto-refresh.
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

// counted off a deadline, which a throttled background tab cannot slow
// (INTERNALS.md, Auto-refresh). The clock starts over here: on a load, a
// change of the setting, and a refresh by hand of every map it sweeps
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

/** @param {boolean} on @param {number} minutes */
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
