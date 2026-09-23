import { DESKTOP_MQ } from '../lib/media.js';
import { anyDialogOpen } from '../page/dialog.js';
import { exitFullscreen } from '../page/iframe.js';
import { arrangeBoard } from './arrange.js';
import { GRID_CELL } from './constants.js';
import { duplicateMap } from './copies.js';
import { floatingBlocks, placePopout } from './core.js';
import { toggleGridShown, toggleGridSnapped } from './grid.js';
import { groupBox, groupMembers, groupStarts, moveGroup } from './groups.js';
import { persistSnapLayout } from './layout.js';
import { updateCovered } from './overlap.js';
import { reloadAllMaps } from './reload.js';

// Keys for what the buttons cannot do in one gesture, and for backing out of
// what covers the screen. The letters name the thing and not the word for it,
// so they stand whatever language the page comes to speak: R is the [R] the bar
// already carries, G the grid and S its snap. (K, which opens the dialog and is
// the Croatian Karte, lives in settings/panel.js; Escape for the dialogs in
// page/dialog.js.) The three are also the tab's glyph cluster, which is where they can be read off:
// [R] [G] [S], each titled with its key. None of this reaches the page while an
// iframe holds the focus — a press inside a frame belongs to the frame's
// document, and these maps are another origin — so a click on the page or on a
// title bar comes first, as it does for the pointer (see updateCovered). The
// dialog's guard is repeated here: not from a text field, whose own Escape is a
// way out of the field, and not under a modifier, which belongs to the browser
const NUDGE_KEYS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

export function initWidgetKeys() {
	document.addEventListener('keydown', (e) => {
		if (e.altKey || e.ctrlKey || e.metaKey) return;
		if (e.target.matches && e.target.matches('input:not([type="radio"]):not([type="checkbox"]), textarea, [contenteditable]')) return;
		// a fullscreen map is a class and not the browser's own fullscreen, so
		// nothing takes Escape off it; wherever there is a keyboard, this does
		if (e.key === 'Escape') { escapeFullscreen(); return; }
		if (!DESKTOP_MQ.matches) return; // the rest act on widgets, which are a desktop thing
		if (e.key === 'r' || e.key === 'R') { e.preventDefault(); reloadAllMaps(); return; }
		if (e.key === 'g' || e.key === 'G') { e.preventDefault(); toggleGridShown(); return; }
		if (e.key === 's' || e.key === 'S') { e.preventDefault(); toggleGridSnapped(); return; }
		// these two stand down under a dialog, as the arrows do below: a board
		// rearranged or a copy made there would be done out of sight
		if (e.key === 'a' || e.key === 'A') { e.preventDefault(); if (!anyDialogOpen()) arrangeBoard(); return; }
		if (e.key === 'd' || e.key === 'D') { e.preventDefault(); if (!anyDialogOpen()) duplicateMap(topPopout()); return; }
		// the arrows belong to whatever is on top. While the dialog is open that is
		// the dialog: its body is the only thing that scrolls there, and a widget
		// behind it is not what an arrow pressed on the map list is aimed at. The
		// grid keys above are another matter — those two switches are the dialog's
		// own as well, and it is re-read when they change (setGridPrefs)
		const nudge = NUDGE_KEYS[e.key];
		if (!nudge || anyDialogOpen()) return;
		e.preventDefault(); // the page would scroll under it
		const step = e.shiftKey ? 1 : GRID_CELL;
		nudgePopout(nudge[0] * step, nudge[1] * step);
	});
}

// the dialog owns Escape while it is open; under it Escape ends a fullscreen
// map, and under that it does nothing — backing out is not a reason to take
// an arrangement apart
function escapeFullscreen() {
	if (anyDialogOpen()) return;
	const fs = document.querySelector('.if1.fullscreen');
	if (fs) exitFullscreen(fs);
}

// the widget the keys move is the one on top. popoutZ already names it and the
// shadow layer leaves it unmistakable, so it needs no mark of its own: the
// press shows which it was, and a click on another picks another. A pane is
// out of it (it lives in its column, where a top is not a place), and so is a
// widget hosting a fullscreen map, whose box is not to be seen
function topPopout() {
	return floatingBlocks()
		.filter(block => !block.classList.contains('fs-host'))
		.reduce((top, block) => !top || (Number(block.style.zIndex) || 0) >= (Number(top.style.zIndex) || 0) ? block : top, null);
}

// one cell of the grid a press, so a board snapped to it stays snapped; one
// pixel with Shift, for the placement the lines have none for. A group moves
// whole, as it does under the pointer, and the viewport holds it the same way
function nudgePopout(dx, dy) {
	const block = topPopout();
	if (!block) return;
	const members = groupMembers(block);
	if (members.length > 1) {
		const starts = groupStarts(members);
		moveGroup(starts, groupBox(starts), dx, dy);
	} else {
		const rect = block.getBoundingClientRect();
		placePopout(block, rect.left + dx, rect.top + dy);
	}
	updateCovered(); // the shadows and the order follow at once; the writing waits
	nudgePersist();
}

// a held arrow repeats, and each repeat would write the arrangement: it is
// written once, when the widget has come to rest
let nudgeTimer = 0;

function nudgePersist() {
	clearTimeout(nudgeTimer);
	nudgeTimer = setTimeout(persistSnapLayout, 300);
}
