import { DESKTOP_MQ } from '../lib/media.js';
import { registerCommand } from '../page/commands.js';
import { anyDialogOpen } from '../page/dialog.js';
import { arrangeBoard } from './arrange.js';
import { GRID_CELL } from './constants.js';
import { duplicateMap } from './copies.js';
import { floatingBlocks, placePopout } from './core.js';
import { toggleGridShown, toggleGridSnapped } from './grid.js';
import { groupBox, groupMembers, groupStarts, moveGroup } from './groups.js';
import { arrangementChanged } from './layout.js';
import { refreshOverlap } from './overlap.js';
import { reloadAllMaps } from './reload.js';

// The widgets' commands: R reloads (the bar's [R]), G the grid, S its snap,
// A arranges, D duplicates, the arrows nudge. The letters name the thing, not
// a word for it. (K is the dialog's, Escape the page's: page/commands.js.)
// A key pressed inside a frame never reaches the page, so the focus has to be
// on the page or a title bar first
const NUDGE_KEYS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

export function initWidgetKeys() {
	const desktop = () => DESKTOP_MQ.matches;
	// these stand down under a dialog, as the arrows do below: a board
	// rearranged or a copy made there would be done out of sight
	const inSight = () => DESKTOP_MQ.matches && !anyDialogOpen();
	registerCommand('reload', { keys: ['r', 'R'], keyWhen: desktop, run: () => reloadAllMaps() });
	registerCommand('grid-show', { keys: ['g', 'G'], keyWhen: desktop, run: () => toggleGridShown() });
	registerCommand('grid-snap', { keys: ['s', 'S'], keyWhen: desktop, run: () => toggleGridSnapped() });
	registerCommand('arrange', { keys: ['a', 'A'], keyWhen: inSight, run: () => arrangeBoard() });
	registerCommand('duplicate', { keys: ['d', 'D'], keyWhen: inSight, run: () => duplicateMap(topPopout()) });
	// the arrows belong to whatever is on top. While the dialog is open that is
	// the dialog: its body is the only thing that scrolls there, and a widget
	// behind it is not what an arrow pressed on the map list is aimed at. The
	// grid keys above are another matter — those two switches are the dialog's
	// own as well, and it follows them (grid-changed). One grid cell a press,
	// one pixel with Shift
	registerCommand('nudge', {
		keys: Object.keys(NUDGE_KEYS),
		keyWhen: inSight,
		run: (control, e) => {
			const [x, y] = NUDGE_KEYS[e.key];
			const step = e.shiftKey ? 1 : GRID_CELL;
			nudgePopout(x * step, y * step);
		}
	});
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
	refreshOverlap(); // the shadows and the order follow at once; the writing waits
	nudgePersist();
}

// a held arrow repeats, and each repeat would write the arrangement: it is
// written once, when the widget has come to rest
let nudgeTimer = 0;

function nudgePersist() {
	clearTimeout(nudgeTimer);
	nudgeTimer = setTimeout(arrangementChanged, 300);
}
