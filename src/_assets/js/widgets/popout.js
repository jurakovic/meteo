// Pop-out widgets (desktop): a map block lifted out of the page into a fixed,
// draggable, resizable widget, so it stays visible while the rest of the page
// scrolls. Nothing moves in the DOM (an iframe would reload): the block only
// gets a class and inline left/top/width, the same trick as the iframe
// fullscreen. A gap of the block's height keeps its place in the table and
// offers a way back.

import { dlog } from '../lib/debug.js';
import { el } from '../lib/dom.js';
import { DESKTOP_MQ } from '../lib/media.js';
import { RESIZE_HANDLES } from '../lib/pointer.js';
import { catalogMap } from '../maps/catalog.js';
import { exitFullscreen } from '../page/iframe.js';
import { dashboardMode, removeFromDashboard, setDashboard } from './board.js';
import { isSnapped, layoutSnapColumns, unsnapPane } from './columns.js';
import { POPOUT_WIDTH, TITLE_GAP } from './constants.js';
import { isDuplicate, otherShowings, removeShowing } from './copies.js';
import { isFreePopout, placePopout, popoutMaxWidth, raisePopout } from './core.js';
import { leaveGroup } from './groups.js';
import { persistSnapLayout, withPersistPaused } from './layout.js';
import { syncShadows } from './overlap.js';
import { lockedHeightAt, lockedWidthFor } from './resize.js';

export function buildPopoutButton() {
	const btn = el('a', { class: 'po-btn' });
	btn.addEventListener('click', () => togglePopout(btn.closest('.map-block')));
	setPopoutButton(btn, false);
	return btn;
}

export function setPopoutButton(btn, popped) {
	// ASCII only: an arrow glyph comes from a fallback font and sits off the baseline of [ ] and [X]
	// on the board there is no page to go back to: the button takes the map off the board
	btn.textContent = !popped ? '[^]' : dashboardMode ? '[x]' : '[=]';
	btn.title = !popped ? 'Izdvoji kartu u pomični prozor' : dashboardMode ? 'Ukloni kartu s ploče' : 'Vrati kartu na stranicu';
}

export function togglePopout(block) {
	if (!block) return;
	if (!block.classList.contains('popout')) { if (DESKTOP_MQ.matches) popoutMap(block); }
	// only a map's last showing docks or leaves the board; any other goes alone
	else if (otherShowings(block).length) removeShowing(block);
	else if (dashboardMode) removeFromDashboard(block);
	else dockMap(block);
}

export function popoutMap(block) {
	dlog(`popoutMap: ${block.dataset.mapId}`);
	const rect = block.getBoundingClientRect();
	// a copy holds no place in the page, so it leaves nothing behind in it. The
	// gap's way back docks whichever showing holds the place by then
	if (!isDuplicate(block)) {
		const back = el('a', { text: 'Vrati' });
		const gap = el('div', { class: 'map-gap', style: `height: ${rect.height}px;` }, [
			el('span', { text: 'Karta je izdvojena u prozor ·' }),
			back
		]);
		back.addEventListener('click', () => dockMap(gap._block));
		gap._block = block;
		block._gap = gap;
		block.after(gap);
	}
	block.classList.add('popout');
	block.style.width = `${Math.min(POPOUT_WIDTH, rect.width)}px`;
	// an interactive map is sized freely in both dimensions: it starts at the
	// height its aspect gives it at this width, then the block takes over from
	// the .if1/.if2 padding (.free lays it out as a column, the map fills)
	if (isFreePopout(block)) {
		block.style.height = `${block.offsetHeight}px`;
		block.classList.add('free');
	}
	RESIZE_HANDLES.forEach(dir => block.appendChild(el('div', { class: `po-h po-h-${dir}`, 'data-dir': dir })));
	// stays where it was on screen, so it reads as lifted rather than teleported
	placePopout(block, rect.left, rect.top);
	raisePopout(block);
	block.querySelectorAll('.po-btn').forEach(btn => setPopoutButton(btn, true));
	persistSnapLayout();
}

// a locked widget freed of its aspect: it becomes a free widget (an inline
// height, the column layout, the height stored in the layout) with the
// media letterboxed in what the title bar leaves (.letterbox, CSS) over a
// blurred and darkened copy of the image showing (.po-backdrop, the image
// in --po-img), so the bars around it are of the map and not of the frame
export function unlockAspect(block) {
	if (block.classList.contains('free')) return;
	dlog(`unlockAspect: ${block.dataset.mapId}`);
	block.style.height = `${block.offsetHeight}px`;
	block.classList.add('free', 'letterbox');
	if (!block.querySelector('.po-backdrop')) block.appendChild(el('div', { class: 'po-backdrop' }));
	syncBackdrop(block);
}

// the double-click's lock: the widget comes in to the image as it is painted,
// rather than the image being blown up to the width the widget happens to have.
// A letterboxed image is contained in its box, so one axis is the image's and
// the other is ground beside it. Of the two ways to take the aspect back — at
// the width it has, or at the width that gives the height it has — the smaller
// is the image: whichever axis was holding the contain is the one kept, and the
// widget only ever comes in. In a column the width is the column's, so a pane
// simply takes the aspect back
export function lockToImage(block) {
	const rect = block.getBoundingClientRect();
	lockAspect(block);
	if (isSnapped(block)) return;
	// an image not yet there has no painted size to come in to
	const img = block.querySelector('.slide.active img') || block.querySelector('.placeholder img');
	if (img && !(img.complete && img.naturalWidth)) return;
	// the seed is taken at the width the widget has, which the map follows at
	// every width, so the ratio read there is the map's and not the ground's
	const cap = popoutMaxWidth();
	const tall = lockedHeightAt(block, Math.min(rect.width, cap));
	if (tall > rect.height + 0.5) {
		const ratio = rect.width / tall;
		const w = lockedWidthFor(block, rect.height, rect.height * ratio, ratio, cap);
		block.style.width = `${Math.round(w)}px`;
	}
	placePopout(block, rect.left, rect.top);
}

// back to the height the aspect gives at the width it has
export function lockAspect(block) {
	if (!block.classList.contains('letterbox')) return;
	dlog(`lockAspect: ${block.dataset.mapId}`);
	block.classList.remove('free', 'letterbox');
	block.style.removeProperty('height');
	block.style.removeProperty('--po-img');
}

// the backdrop shows the image on screen: the active slide's, or the map's;
// followed on every load and slide change, and through a reload's fresh
// address. A video has no image to take, and neither can one be read off it
// (the catalog entry says why), so where the map gives a `backdrop` that still
// frame stands in — which also covers a lazy slide whose src is not swapped in
// yet, an img carrying its address even when the load then fails
export function syncBackdrop(block) {
	if (!block.classList.contains('letterbox')) return;
	const img = block.querySelector('.slide.active img') || block.querySelector('img');
	const map = catalogMap(block.dataset.mapId);
	const src = (img && (img.currentSrc || img.src)) || (map && map.backdrop);
	if (src) block.style.setProperty('--po-img', `url("${src}")`);
}

// a popped-out widget's title would run under the button clusters, which sit
// on the bar out of flow: it is centred in the gap between them instead,
// from the pop-out on so it never jumps, and given the gap's width with an
// ellipsis (CSS) for when it is too long. Measured after every gesture and
// whenever a button comes or goes; a bar not on screen (a slide not shown)
// is left for when it is

function fitTitles(block) {
	block.querySelectorAll('.radartitle:not(.fullscreen)').forEach(bar => {
		if (!bar.clientWidth) return;
		const title = [...bar.children].find(c => c.tagName === 'A' && !c.classList.contains('left') && !c.classList.contains('right'));
		if (!title) return;
		const cluster = (selector) => { const node = bar.querySelector(`:scope > ${selector}`); return node ? node.offsetWidth + 3 : 0; }; // with its margin
		const left = cluster('.left'), right = cluster('.right');
		const width = bar.clientWidth - 6; // less the padding
		title.style.maxWidth = `${Math.max(0, width - left - right - 2 * TITLE_GAP)}px`;
		title.style.setProperty('--title-shift', `${Math.round((left - right) / 2)}px`);
	});
}

function unfitTitles(block) {
	block.querySelectorAll('.radartitle a').forEach(a => {
		a.style.removeProperty('max-width');
		a.style.removeProperty('--title-shift');
	});
}

// A letterboxed image is painted smaller than the box it is centred in:
// object-fit contains it inside the element and lays nothing out, so the arrows
// (absolute in the .slideshow) and the indicators (as wide as it) would span the
// whole widget rather than the image they belong to. CSS cannot see a
// contain-fitted image's rect, so it is worked out here — the natural ratio
// against the element's box — and published as the four insets from the
// .slideshow the arrows are positioned in (which takes the slide's own title bar
// off the top for free) and the painted width for the indicators to take and
// centre themselves in. Measured wherever the title is, and for the same
// reasons: the box changes with every gesture, and the image with a slide or a
// reload
function fitLetterbox(block) {
	const props = ['--lb-l', '--lb-r', '--lb-t', '--lb-b', '--lb-w'];
	const box = block.querySelector('.slideshow');
	const img = block.querySelector('.slide.active img') || block.querySelector('.placeholder img');
	if (!block.classList.contains('letterbox') || !box || !img || !img.naturalWidth || !img.clientWidth) {
		props.forEach(p => block.style.removeProperty(p));
		return;
	}
	const rect = img.getBoundingClientRect(), outer = box.getBoundingClientRect();
	const ratio = img.naturalWidth / img.naturalHeight;
	const width = Math.min(rect.width, rect.height * ratio);
	const height = Math.min(rect.height, rect.width / ratio);
	const left = rect.left + (rect.width - width) / 2, top = rect.top + (rect.height - height) / 2;
	const px = (n) => `${Math.round(Math.max(0, n))}px`;
	block.style.setProperty('--lb-l', px(left - outer.left));
	block.style.setProperty('--lb-r', px(outer.right - (left + width)));
	block.style.setProperty('--lb-t', px(top - outer.top));
	block.style.setProperty('--lb-b', px(outer.bottom - (top + height)));
	block.style.setProperty('--lb-w', px(width));
}

// the two go together everywhere: both are the widget's chrome fitted to the
// box it has now, and every gesture that changes the box changes both
export function fitWidget(block) {
	fitTitles(block);
	fitLetterbox(block);
}

export function dockMap(block) {
	dlog(`dockMap: ${block.dataset.mapId}`);
	// a copy has no place in the page to go back to (Vrati sve, the breakpoint)
	if (isDuplicate(block)) return removeShowing(block);
	// a fullscreen iframe inside the widget is fixed on its own; take it down first
	const fs = block.querySelector('.if1.fullscreen');
	if (fs) exitFullscreen(fs);
	if (block._group) leaveGroup(block);
	unsnapPane(block);
	block.classList.remove('popout', 'free', 'grouped', 'letterbox', 'covered');
	['left', 'top', 'width', 'height', 'z-index', '--po-img', '--lb-l', '--lb-r', '--lb-t', '--lb-b', '--lb-w']
		.forEach(p => block.style.removeProperty(p));
	block.querySelectorAll('.po-h, .po-backdrop').forEach(h => h.remove());
	if (block._gap) block._gap.remove();
	delete block._gap;
	block.querySelectorAll('.po-btn').forEach(btn => setPopoutButton(btn, false));
	unfitTitles(block);
	persistSnapLayout();
}

// everything back on the page — which is leaving the board, where every map
// is a widget: the page comes back first, since its scrollbar changes the
// viewport the widgets are docked from
export function dockAllPopouts() {
	setDashboard(false);
	layoutSnapColumns();
	// one write for the lot: every dockMap would otherwise store the arrangement
	// on its way out, and the only one worth storing is the last
	withPersistPaused(() => document.querySelectorAll('.map-block.popout').forEach(dockMap));
	persistSnapLayout(); // also with nothing to dock: the mode may have changed
	syncShadows(); // the breakpoint docks with persistence paused, so the sweep is not reached through it
}
