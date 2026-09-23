// What lies over what: frames covered by another widget stop taking the
// pointer, and every widget's shadow is drawn in a layer beneath them all.
//
// An iframe takes the pointer itself, and a press inside it belongs to the
// frame's document: the page never sees it, so a widget clicked into would stay
// under the one over it. Most maps are spared by their gate, an .overlay over
// the frame that takes the press, but a basic iframe (.if2) has none and an
// interactive one loses its own once the gate is let through. Nor can the page
// be told after the fact — the focus moving from one frame to another raises no
// event it can hear (see the blur handler below, which catches only the move in
// from the page itself). So a frame with another widget lying over it stops
// taking the pointer at all (`covered`, the CSS): the press lands on the widget
// instead and raises it, the class goes with the raise, and the frame is live
// for the next press. Click it to the front, then work the map — which is what a
// window does. A widget nothing overlaps is never covered, so a map standing on
// its own is untouched

import { el } from '../lib/dom.js';
import { trackPointer } from '../lib/pointer.js';
import { isSnapped } from './columns.js';
import { allPopouts } from './core.js';
import { fitBoardFullscreen } from './fullscreen.js';

export function updateCovered() {
	const boxes = allPopouts().map(block => ({
		block,
		rect: block.getBoundingClientRect(),
		z: Number(block.style.zIndex) || 0
	}));
	boxes.forEach(a => {
		const under = boxes.some(b => b.block !== a.block && b.z > a.z
			&& b.rect.left < a.rect.right && b.rect.right > a.rect.left
			&& b.rect.top < a.rect.bottom && b.rect.bottom > a.rect.top);
		// a widget hosting a fullscreen map is deliberately under the others; its
		// map fills the column or the page and is the one thing meant to be used
		a.block.classList.toggle('covered', under && !a.block.classList.contains('fs-host'));
	});
	// the same call sites, and the same reason: a widget moved or raised beside
	// a fullscreen map on the board changes the rectangle that map is to fill
	fitBoardFullscreen();
	syncShadows(); // the same call sites: wherever a widget's rect or its order can have changed
}

// A widget's shadow belongs to what is behind the widgets, not to the widget
// beside it: a shadow drawn by the widget itself paints in that widget's place
// in the order, so of two widgets side by side the raised one lays its shadow
// across its neighbour. So no widget carries one. Each has a box of its own size
// in a layer under the whole widget range, over the page and the docked maps on
// it, the columns' ground and the graph paper, and that box carries the shadow.
// An outer box-shadow is clipped out of its own border box, so the box paints
// the halo alone and the widget sits on it exactly. Every widget is then over
// every shadow whatever the order among themselves, which also lets a grouped
// widget keep a shadow: a member's falls under the member beside it, not across
// it. A pane in a column has none (docked into the column's ground rather than
// floating over it), nor has a widget hosting a fullscreen map, whose box is not
// to be seen.
//
// There are two such layers because a fullscreen map lies between them, and a
// shadow falls on whatever is behind its own widget: a widget standing on that
// map casts onto it, as it would onto the page, while one standing beside it —
// one that walled the map off, so the map begins where the widget ends — casts
// under, and the map covers the halo exactly as the host's own box did. Which
// layer a box belongs in is syncShadows(); the CSS gives them their z-index.

// over is the layer over a fullscreen map, and the only one while none is up
function shadowLayer(over) {
	const cls = over ? 'po-shadows' : 'po-shadows-under';
	let layer = document.querySelector(`.${cls}`);
	if (!layer) document.body.appendChild(layer = el('div', { class: cls }));
	return layer;
}

function castsShadow(block) {
	return !isSnapped(block) && !block.classList.contains('fs-host');
}

// what a fullscreen map and its bar are painted in, null when none is up. They
// are fixed and placed by the CSS off the --fs-* properties, so their own rects
// are the answer wherever the extent came from — the viewport, the room between
// the columns, a column, or what the board's widgets leave
function fullscreenRect() {
	const map = document.querySelector('.if1.fullscreen');
	if (!map) return null;
	const bar = document.querySelector('.radartitle.fullscreen');
	const r = map.getBoundingClientRect();
	if (!bar) return r;
	const b = bar.getBoundingClientRect();
	return {
		left: Math.min(r.left, b.left), right: Math.max(r.right, b.right),
		top: Math.min(r.top, b.top), bottom: Math.max(r.bottom, b.bottom)
	};
}

// every widget's box placed on its rect, in the layer its standing asks for,
// and any box left without a widget — one docked, or gone with the tbody —
// swept out of both
export function syncShadows() {
	const live = new Set();
	const fs = fullscreenRect();
	const layers = new Map(); // looked up once each, not once per widget
	const layerFor = (over) => layers.get(over) || layers.set(over, shadowLayer(over)).get(over);
	allPopouts().forEach(block => {
		if (!castsShadow(block)) return;
		// the rect as it is: a widget's place carries thousandths of a pixel
		// (subpixel(), moveGroup) and its shadow is to stand exactly on it
		const rect = block.getBoundingClientRect();
		// a widget standing on the map casts onto it, as it would onto the page;
		// one standing beside it casts under, so the halo of a widget that walled
		// the map off does not spill over the map it made room for
		const over = !fs || (rect.left < fs.right && rect.right > fs.left
			&& rect.top < fs.bottom && rect.bottom > fs.top);
		const layer = layerFor(over);
		if (!block._shadow || block._shadow.parentElement !== layer) {
			if (block._shadow) block._shadow.remove();
			block._shadow = el('div', { class: 'po-shadow' });
			layer.appendChild(block._shadow);
		}
		block._shadow.style.cssText =
			`left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px; height: ${rect.height}px;`;
		live.add(block._shadow);
	});
	document.querySelectorAll('.po-shadows, .po-shadows-under').forEach(layer =>
		[...layer.children].forEach(box => { if (!live.has(box)) box.remove(); }));
}

// a pointer gesture on a widget, a group, a pane or a column: the shadows
// follow it live, since updateCovered — which syncs them otherwise — runs
// only once the gesture is over
export function trackWidgetPointer(e, onMove, onEnd) {
	trackPointer(e, onMove, onEnd, syncShadows);
}
