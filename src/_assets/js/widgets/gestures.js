// The pointer on a widget: pressing raises it, the title bar drags it, a handle
// resizes it (or its seam), a column edge resizes the column; the title bar's
// double and middle clicks; and a frame taking the focus raises its widget.

import { DESKTOP_MQ } from '../lib/media.js';
import { layoutSnapColumns, snapColumn, snapHandlePointerDown, snapPaneOf, toggleSnapPage } from './columns.js';
import { raisePopout } from './core.js';
import { dragPopout } from './drag.js';
import { arrangementChanged } from './layout.js';
import { fitWidget, lockToImage, togglePopout } from './popout.js';
import { resizePopout, resizeSeam, seamNeighbour } from './resize.js';

export function initWidgetGestures() {
	document.addEventListener('pointerdown', onPointerDown);
	// on a tick, the frame holding the focus only after the event. A blur that
	// went anywhere else — another tab, another window — leaves activeElement
	// something other than a frame, and raises nothing
	window.addEventListener('blur', () => setTimeout(raiseFocusedFrame));
	document.addEventListener('mousedown', onMiddleDown);
	document.addEventListener('auxclick', onMiddleClick);
	// the drag's preventDefault on pointerdown leaves click and dblclick alone,
	// and the browser already tells a double-click from two drags apart
	document.addEventListener('dblclick', onDoubleClick);
}

// a press on a column's edge resizes the column; on a widget it raises it, and
// on its handle resizes it, on its title bar drags it
function onPointerDown(e) {
	const snapHandle = e.target.closest('.snap-edge');
	if (snapHandle) {
		if (e.button !== 0) return;
		e.preventDefault();
		snapHandlePointerDown(snapHandle, e);
		return;
	}
	const block = e.target.closest('.map-block.popout');
	if (!block) return;
	// a widget hosting a fullscreen map stays under the others (see map-fullscreen)
	if (!block.classList.contains('fs-host')) raisePopout(block);
	if (e.button !== 0) return;
	const handle = e.target.closest('.po-h');
	const title = e.target.closest('.radartitle');
	// links and buttons keep working; a fullscreen bar is pinned, not a handle
	if (!handle && (!title || e.target.closest('a') || title.classList.contains('fullscreen'))) return;
	// also suppresses the compatibility mousedown, so a slide title bar drag
	// cannot register as a swipe on the slideshow around it
	e.preventDefault();
	if (handle) resizeFromHandle(block, handle.dataset.dir, e);
	else dragPopout(block, e);
}

// a shared whole edge is a seam and moves as one, which is ahead of both the
// single widget's pull and the group's scale: it is an inside edge, and those
// two are what an outside edge means
function resizeFromHandle(block, dir, e) {
	const mate = seamNeighbour(block, dir);
	if (!mate) resizePopout(block, dir, e);
	else if (!(e.ctrlKey || e.metaKey)) resizeSeam(block, mate, dir, e);
	else {
		// Ctrl pulls one side of the seam alone: the widget the press is
		// on the side of. The handles straddle the edge, so a press just
		// inside a widget is a press on its edge, whichever handle took it
		const r = block.getBoundingClientRect();
		const inside = dir === 'e' ? e.clientX < r.right
			: dir === 'w' ? e.clientX >= r.left
			: dir === 's' ? e.clientY < r.bottom
			: e.clientY >= r.top;
		const opposite = { e: 'w', w: 'e', n: 's', s: 'n' };
		if (inside) resizePopout(block, dir, e);
		else {
			raisePopout(mate); // the one that moves is the one in front
			resizePopout(mate, opposite[dir], e);
		}
	}
}

// the middle button raises the autoscroll cursor on press: the press is taken
// here and the action left to auxclick, which is the click the middle button
// makes
function onMiddleDown(e) {
	if (e.button === 1 && DESKTOP_MQ.matches && titleBarOf(e)) e.preventDefault();
}

function onMiddleClick(e) {
	if (e.button !== 1 || !DESKTOP_MQ.matches) return;
	const bar = titleBarOf(e);
	if (!bar) return;
	e.preventDefault();
	togglePopout(bar.closest('.map-block')); // docks on the page, takes the map off the board
}

function onDoubleClick(e) {
	if (!e.target.closest) return;
	const edge = e.target.closest('.snap-edge');
	if (edge) toggleSnapPage(snapColumn(edge.dataset.side));
	// a double-click on a widget's title bar puts its map in fullscreen and
	// takes it out again (toggleBarFullscreen: an interactive map only, which
	// is never the letterboxed widget below)
	const bar = titleBarOf(e);
	if (bar) toggleBarFullscreen(bar);
	// a double-click on a freed widget's title bar (a link or button aside)
	// locks it again, coming in to the image where it stands (lockToImage) —
	// a pane's height goes with it
	const title = e.target.closest('.map-block.popout.letterbox .radartitle:not(.fullscreen)');
	if (title && !e.target.closest('a')) {
		const block = title.closest('.map-block');
		lockToImage(block);
		const pane = snapPaneOf(block);
		if (pane) delete pane.height;
		layoutSnapColumns();
		fitWidget(block);
		arrangementChanged();
	}
}

// A press into the frame of a widget nothing covers reaches the frame, and the
// page hears of it only as the window's blur; raising the widget then keeps the
// order right for later. It sees a move in from the page only (frame to frame
// raises nothing here), which is why covered widgets are handled by `covered`
function raiseFocusedFrame() {
	const frame = document.activeElement;
	if (!frame || frame.tagName !== 'IFRAME') return;
	const block = /** @type {HTMLElement | null} */ (frame.closest('.map-block.popout'));
	// as above: a widget hosting a fullscreen map is kept under the others
	if (block && !block.classList.contains('fs-host')) raisePopout(block);
}

// The title bar works as a window's does: beside the drag, a double-click
// toggles fullscreen and a middle click is the bar's [=]/[x]. On the bar only:
// over a frame the page never sees them, and on an interactive map a
// double-click already opens the gate (page/iframe.js). A link or button on
// the bar keeps its own clicks (the title is a link to the source)
function titleBarOf(e) {
	if (!e.target.closest || e.target.closest('a, button, input')) return null;
	return e.target.closest('.map-block.popout .radartitle');
}

// through the bar's own [ ] button, which keeps its label and the snapshot of
// the overlay gate; toggleFullscreen() reads the class, so the one press both
// enters and leaves, and the bar is still on screen in fullscreen to leave by.
// Only an interactive map (.if1) has the button — this is the same element the
// aspect lock below is on, and never the same widget: an iframe is always free
// (isFreePopout) and so is never letterboxed
function toggleBarFullscreen(bar) {
	const fsBtn = bar.closest('.map-block').querySelector('.fs-btn');
	if (fsBtn) fsBtn.click();
}
