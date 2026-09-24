// A pointer gesture — a drag or a resize of a widget, a column, the tab or a
// dialog — tracked on the document from its pointerdown to its release.

// the sides and corners a window is resized from
export const RESIZE_HANDLES = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

// the size a box that started as start (width/height) is pulled to by the
// handle dir moved dx, dy: an east edge adds to the width, a west one takes
// away, and so on; a corner both
/**
 * @param {string} dir one of RESIZE_HANDLES
 * @param {{ width: number, height: number }} start
 * @param {number} dx @param {number} dy
 * @returns {{ w: number, h: number }}
 */
export function pulledSize(dir, start, dx, dy) {
	let w = start.width, h = start.height;
	if (dir.includes('e')) w = start.width + dx;
	if (dir.includes('w')) w = start.width - dx;
	if (dir.includes('s')) h = start.height + dy;
	if (dir.includes('n')) h = start.height - dy;
	return { w, h };
}

// move and up listeners on document (nothing moves in the DOM), and
// .po-dragging turns iframe pointer events off so the pointer is not
// swallowed when it crosses one mid-gesture. onMove gets the offset from the
// start and the event; onEnd runs once the pointer is released (or the
// gesture cancelled); afterMove, when given, after every move.
//
// Shift is answered while the gesture runs and not only as it stood when it
// began (resizePopout): the last move is made again with the key as it now
// is, so a pull already under way changes what it does the moment the key
// goes down or comes up, with the pointer held still. A KeyboardEvent
// carries no coordinates, so the pointer's last stand in — the same move
// over again, which every onMove here takes without moving anything
/**
 * @param {PointerEvent} e the pointerdown
 * @param {(dx: number, dy: number, ev: { clientX: number, clientY: number, shiftKey: boolean }) => void} onMove
 * @param {() => void} [onEnd]
 * @param {() => void} [afterMove]
 */
export function trackPointer(e, onMove, onEnd, afterMove) {
	const startX = e.clientX, startY = e.clientY;
	let dx = 0, dy = 0, at = e; // where the pointer was left, for the key to repeat
	const move = (ev) => {
		at = ev;
		dx = ev.clientX - startX;
		dy = ev.clientY - startY;
		onMove(dx, dy, ev);
		if (afterMove) afterMove();
	};
	const key = (ev) => {
		if (ev.key !== 'Shift' || ev.repeat) return;
		onMove(dx, dy, { clientX: at.clientX, clientY: at.clientY, shiftKey: ev.type === 'keydown' });
		if (afterMove) afterMove();
	};
	const stop = () => {
		document.removeEventListener('pointermove', move);
		document.removeEventListener('pointerup', stop);
		document.removeEventListener('pointercancel', stop);
		document.removeEventListener('keydown', key);
		document.removeEventListener('keyup', key);
		document.body.classList.remove('po-dragging');
		if (onEnd) onEnd();
	};
	document.body.classList.add('po-dragging');
	document.addEventListener('pointermove', move);
	document.addEventListener('pointerup', stop);
	document.addEventListener('pointercancel', stop);
	document.addEventListener('keydown', key);
	document.addEventListener('keyup', key);
}
