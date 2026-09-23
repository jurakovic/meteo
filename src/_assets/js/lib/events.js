// The page's own events: how a part of the site says that something changed
// without knowing who is listening (the widgets do not call into the dialog,
// the dialog does not call into the columns). They are CustomEvents on the
// document; every one the site uses is named here, with what it carries.

export const EVENTS = {
	// a dialog was shown or shut: { panel, visible } (page/dialog.js)
	dialogToggled: 'dialog-toggled',
	// the maps switched off remotely changed (remote-config.js)
	mapConfigChanged: 'map-config-changed',
	// an interactive map went into or out of its fullscreen (page/iframe.js)
	mapFullscreen: 'map-fullscreen',
	// the arrangement of the widgets changed and was stored (widgets/layout.js)
	layoutChanged: 'layout-changed',
	// the board's grid switches changed (widgets/grid.js)
	gridChanged: 'grid-changed',
	// auto-refresh was switched or its interval changed (widgets/refresh.js)
	refreshChanged: 'refresh-changed',
	// a second of auto-refresh's countdown went by, or it started over (widgets/refresh.js)
	refreshTick: 'refresh-tick'
};

export function emit(name, detail) {
	document.dispatchEvent(new CustomEvent(name, { detail }));
}

// handler(detail) on every emit of name
export function on(name, handler) {
	document.addEventListener(name, (e) => handler(e.detail));
}
