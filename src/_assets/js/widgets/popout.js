// Pop-out widgets (desktop): a map block lifted out of the page into a fixed,
// draggable, resizable widget, so it stays visible while the rest of the page
// scrolls. Nothing moves in the DOM (an iframe would reload): the block only
// gets a class and inline left/top/width, the same trick as the iframe
// fullscreen. A gap of the block's height keeps its place in the list and
// offers a way back.

import { buildReloadButton } from './reload.js';
import { buildGroupButton } from './groups.js';
import { buildDuplicateButton } from './copies.js';
import { dlog } from '../lib/debug.js';
import { el, query, queryAll } from '../lib/dom.js';
import { DESKTOP_MQ } from '../lib/media.js';
import { RESIZE_HANDLES } from '../lib/pointer.js';
import { catalogMap } from '../maps/catalog.js';
import { exitFullscreen } from '../page/iframe.js';
import { isDashboard, removeFromDashboard, setDashboard } from './board.js';
import { isSnapped, layoutSnapColumns, unsnapPane } from './columns.js';
import { POPOUT_WIDTH, TITLE_GAP } from './constants.js';
import { isDuplicate, otherShowings, removeShowing } from './copies.js';
import { isFreePopout, placePopout, popoutMaxWidth, raisePopout, shownImage } from './core.js';
import { groupOf, leaveGroup } from './groups.js';
import { arrangementChanged, withPersistPaused } from './layout.js';
import { syncShadows } from './overlap.js';
import { lockedHeightAt, lockedWidthFor } from './resize.js';

function buildPopoutButton() {
	const btn = el('a', { class: 'po-btn' });
	btn.addEventListener('click', () => togglePopout(btn.closest('.map-block')));
	setPopoutButton(btn, false);
	return btn;
}

/** @param {HTMLElement} btn */
export function setPopoutButton(btn, popped) {
	// ASCII only: an arrow glyph comes from a fallback font and sits off the baseline of [ ] and [X]
	// on the board there is no page to go back to: the button takes the map off the board
	btn.textContent = !popped ? '[^]' : isDashboard() ? '[x]' : '[=]';
	btn.title = !popped ? 'Izdvoji kartu u pomični prozor' : isDashboard() ? 'Ukloni kartu s ploče' : 'Vrati kartu na stranicu';
}

/** @param {HTMLElement} block */
export function togglePopout(block) {
	if (!block) return;
	if (!block.classList.contains('popout')) { if (DESKTOP_MQ.matches) popoutMap(block); }
	// only a map's last showing docks or leaves the board; any other goes alone
	else if (otherShowings(block).length) removeShowing(block);
	else if (isDashboard()) removeFromDashboard(block);
	else dockMap(block);
}

/** @param {HTMLElement} block */
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
		back.addEventListener('click', () => dockMap(blockOfGap.get(gap)));
		setGap(block, gap);
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
	queryAll('.po-btn', block).forEach(btn => setPopoutButton(btn, true));
	arrangementChanged();
}

// a locked widget freed of its aspect: it becomes a free widget (an inline
// height, the column layout, the height stored in the layout) with the
// media letterboxed in what the title bar leaves (.letterbox, CSS) over a
// blurred and darkened copy of the image showing (.po-backdrop, the image
// in --po-img), so the bars around it are of the map and not of the frame
/** @param {HTMLElement} block */
export function unlockAspect(block) {
	if (block.classList.contains('free')) return;
	dlog(`unlockAspect: ${block.dataset.mapId}`);
	block.style.height = `${block.offsetHeight}px`;
	block.classList.add('free', 'letterbox');
	if (!block.querySelector('.po-backdrop')) block.appendChild(el('div', { class: 'po-backdrop' }));
	syncBackdrop(block);
}

// the double-click's lock: the widget comes in to the image as it is painted
// (letterboxed, one axis is ground), keeping whichever axis holds the image, so
// it only ever shrinks. A pane keeps its column's width and takes the aspect
/** @param {HTMLElement} block */
export function lockToImage(block) {
	const rect = block.getBoundingClientRect();
	lockAspect(block);
	if (isSnapped(block)) return;
	// an image not yet there has no painted size to come in to
	const img = shownImage(block);
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
/** @param {HTMLElement} block */
export function lockAspect(block) {
	if (!block.classList.contains('letterbox')) return;
	dlog(`lockAspect: ${block.dataset.mapId}`);
	block.classList.remove('free', 'letterbox');
	block.style.removeProperty('height');
	block.style.removeProperty('--po-img');
}

// the backdrop shows the image on screen, followed on every load, slide change
// and reload. A video has none (nor can a frame be read off it), so the map's
// `backdrop` still stands in; so does it for a lazy slide not yet loaded
/** @param {HTMLElement} block */
export function syncBackdrop(block) {
	if (!block.classList.contains('letterbox')) return;
	const img = shownImage(block) || /** @type {HTMLImageElement | null} */ (block.querySelector('img'));
	const map = catalogMap(block.dataset.mapId);
	const src = (img && (img.currentSrc || img.src)) || (map && map.backdrop);
	if (src) block.style.setProperty('--po-img', `url("${src}")`);
}

// a widget's title is centred in the gap between the button clusters (which
// sit out of flow) and given its width, with an ellipsis (CSS). Measured after
// every gesture and whenever a button comes or goes; a bar not on screen is
// left for when it is

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

// A letterboxed image (object-fit: contain) is painted smaller than its box,
// and CSS cannot see the painted rect, so the arrows and indicators would span
// the whole widget. It is worked out here from the natural ratio and published
// as insets (--lb-*) for the arrows and a width for the indicators; measured
// again whenever the box or the image changes
function fitLetterbox(block) {
	const props = ['--lb-l', '--lb-r', '--lb-t', '--lb-b', '--lb-w'];
	const box = block.querySelector('.slideshow');
	const img = shownImage(block);
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
/** @param {HTMLElement} block */
export function fitWidget(block) {
	fitTitles(block);
	fitLetterbox(block);
}

/** @param {HTMLElement} block */
export function dockMap(block) {
	dlog(`dockMap: ${block.dataset.mapId}`);
	// a copy has no place in the page to go back to (Vrati sve, the breakpoint)
	if (isDuplicate(block)) return removeShowing(block);
	// a fullscreen iframe inside the widget is fixed on its own; take it down first
	const fs = query('.if1.fullscreen', block);
	if (fs) exitFullscreen(fs);
	if (groupOf(block)) leaveGroup(block);
	unsnapPane(block);
	block.classList.remove('popout', 'free', 'grouped', 'letterbox', 'covered');
	['left', 'top', 'width', 'height', 'z-index', '--po-img', '--lb-l', '--lb-r', '--lb-t', '--lb-b', '--lb-w']
		.forEach(p => block.style.removeProperty(p));
	block.querySelectorAll('.po-h, .po-backdrop').forEach(h => h.remove());
	removeGap(block);
	queryAll('.po-btn', block).forEach(btn => setPopoutButton(btn, false));
	unfitTitles(block);
	arrangementChanged();
}

// everything back on the page — which is leaving the board, where every map
// is a widget: the page comes back first, since its scrollbar changes the
// viewport the widgets are docked from
export function dockAllPopouts() {
	setDashboard(false);
	layoutSnapColumns();
	// one write for the lot: every dockMap would otherwise store the arrangement
	// on its way out, and the only one worth storing is the last
	withPersistPaused(() => queryAll('.map-block.popout').forEach(dockMap));
	arrangementChanged(); // also with nothing to dock: the mode may have changed
	syncShadows(); // the breakpoint docks with persistence paused, so the sweep is not reached through it
}

// the gap a block popped out of the page leaves in it, and the block its way
// back docks — which is whichever showing holds the map's place by then
const gapOfBlock = new WeakMap();
const blockOfGap = new WeakMap();

function setGap(block, gap) {
	gapOfBlock.set(block, gap);
	blockOfGap.set(gap, block);
}

function removeGap(block) {
	const gap = gapOfBlock.get(block);
	if (gap) gap.remove();
	gapOfBlock.delete(block);
}

// a showing closed while another of its map stays: the heir takes the gap
// over, and with it the way back
/** @param {HTMLElement} block @param {HTMLElement} heir */
export function handGapTo(block, heir) {
	const gap = gapOfBlock.get(block);
	if (!gap) return;
	setGap(heir, gap);
	gapOfBlock.delete(block);
}

// what the customize page draws its maps with (maps/render.js): every title
// bar carries the widgets' buttons, shown on a desktop (CSS) — an interactive
// map's without [R], its bar keeping its own gate button instead
export const WIDGET_RENDER = { titleButtons: widgetTitleButtons };

function widgetTitleButtons(interactive) {
	return interactive
		? [buildDuplicateButton(), buildGroupButton(), buildPopoutButton()]
		: [buildDuplicateButton(), buildReloadButton(), buildGroupButton(), buildPopoutButton()];
}
