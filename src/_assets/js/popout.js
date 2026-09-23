// Pop-out widgets and snap columns for the customize page: a map block
// lifted out of the table into a fixed widget, dragged, resized, grouped,
// snapped into a column at a viewport edge, and the arrangement remembered
// and shared as part of the view (mapPrefs, presets, ?v=). Loaded before
// maps.js, whose render (at parse time in dev) calls into it, and which
// registers the arrangement's restore on DOMContentLoaded after its own
// render. Uses el() from maps.js and dlog() from main.js at call time only.
// Desktop only: the gestures and the layout apply above the breakpoint.

// ---------- pop-out (desktop) ----------

// a map block lifted out of the page into a fixed, draggable, resizable widget
// so it stays visible while the rest of the page scrolls. Nothing moves in the
// DOM (an iframe would reload): the block only gets a class and inline
// left/top/width, the same trick as the iframe fullscreen. A spacer of the
// block's height keeps its place in the table and offers a way back.
// Desktop only — the button is hidden by the same media query in CSS.
const POPOUT_MQ = window.matchMedia('(min-width: 801px) and (hover: hover) and (pointer: fine)');
const POPOUT_WIDTH = 420;
const POPOUT_MIN_WIDTH = 260;
const POPOUT_MAX_WIDTH = 875; // the table's max-width
const POPOUT_MIN_HEIGHT = 120; // free (iframe) widgets only; the others follow their aspect
const POPOUT_MARGIN = 16; // the gutter a widget is cascaded into, and the gap that still counts as none
const POPOUT_TITLE_HEIGHT = 23; // .radartitle height; keeps the drag handle reachable
const POPOUT_HANDLES = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
const MAGNET = 12; // a dragged widget's edge this close to another floating widget's is pulled onto it
const GROUP_TOUCH = 1; // widgets whose edges lie this close on each other touch, and can be grouped
let popoutZ = 5000; // bumped on every raise so the last touched widget is on top
const POPOUT_FS_Z = 4500; // a widget hosting a fullscreen map: under every other widget, over the columns' ground (CSS puts the page's fullscreen there too)

function buildPopoutButton() {
	const btn = el('a', { class: 'po-btn' });
	btn.addEventListener('click', () => togglePopout(btn.closest('.map-block')));
	setPopoutButton(btn, false);
	return btn;
}

function setPopoutButton(btn, popped) {
	// ASCII only: an arrow glyph comes from a fallback font and sits off the baseline of [ ] and [X]
	// on the board there is no page to go back to: the button takes the map off the board
	btn.textContent = !popped ? '[^]' : dashboardMode ? '[x]' : '[=]';
	btn.title = !popped ? 'Izdvoji kartu u pomični prozor' : dashboardMode ? 'Ukloni kartu s ploče' : 'Vrati kartu na stranicu';
}

function togglePopout(block) {
	if (!block) return;
	if (!block.classList.contains('popout')) { if (POPOUT_MQ.matches) popoutMap(block); }
	// only a map's last showing docks or leaves the board; any other goes alone
	else if (otherShowings(block).length) removeShowing(block);
	else if (dashboardMode) removeFromDashboard(block);
	else dockMap(block);
}

// ---------- copies ----------

// A map can be on screen more than once. [D] makes another showing of it, and
// no showing is the original: each is a widget like the rest, and any of them
// can be closed while the others stay. The page still keeps one row per map,
// so there is no question of where a copy sits in a list it was never in, and
// the row's one place to dock into belongs to whichever showing holds it — the
// one not marked .duplicate. Closing that one hands the place to another
// (removeShowing), so the page always keeps a way back for the map, and only
// the map's last showing docks — or, on the board, takes the map off the list.
//
// A copy is built from the catalog rather than cloned from the DOM, so the
// names its parts carry are its own (maps.js: instSuffix). Two renderings
// sharing one slideshow id is the very thing prefsMapIds() dedupes to avoid —
// the arrows would drive whichever came first while both sets of indicators
// lit up.
function buildDuplicateButton() {
	const btn = el('a', { class: 'dup-btn', text: '[D]', title: 'Udvostruči kartu (D)' });
	btn.addEventListener('click', () => duplicateMap(btn.closest('.map-block')));
	return btn;
}

function isDuplicate(block) {
	return !!block && block.classList.contains('duplicate');
}

function showingsOf(mapId) {
	return [...document.querySelectorAll(`.map-block[data-map-id="${CSS.escape(mapId)}"]`)];
}

function otherShowings(block) {
	return showingsOf(block.dataset.mapId).filter(b => b !== block);
}

// the showing that holds the map's place in the page
function pageShowing(mapId) {
	return showingsOf(mapId).find(b => !isDuplicate(b)) || null;
}

function blockByInst(inst) {
	return document.querySelector(`.map-block[data-inst="${CSS.escape(inst)}"]`);
}

// the lowest free index for this map, so closing the middle showing of three
// and making another gives back the name that was freed rather than climbing —
// the first one's too, once the showing that bore it has been closed
function freeInstance(mapId) {
	for (let index = 1; ; index++) {
		const inst = instKey(mapId, index);
		if (!blockByInst(inst)) return inst;
	}
}

// the copy's own wiring and only its own. initDynamicContent() sweeps the page,
// and setting an iframe's src again reloads every interactive map already on
// screen, costing each of them its pan and its zoom; the two sweeps below are
// safe because they bind once per node and skip what is bound (main.js)
function wireDuplicate(block) {
	block.querySelectorAll('img.lazy').forEach(img => {
		img.src = img.getAttribute('data-src');
		img.classList.remove('lazy');
	});
	block.querySelectorAll('iframe[data-zoom-hr-desktop]').forEach(iframe => setIframeSrc(iframe));
	addSwipeEvents();
	hideOverlayOnDoubleTap();
	updateHintText();
}

function makeDuplicate(mapId, inst) {
	const map = catalogMap(mapId);
	const origin = pageShowing(mapId);
	if (!map || !origin) return null;
	const block = el('div', { class: 'map-block duplicate', 'data-map-id': mapId, 'data-inst': inst },
		buildMapContent(map, inst));
	// beside the map it copies, so the list's order still reads off the DOM
	// (arrangeBoard) and a map dropped from the list takes its copies with it.
	// It holds no place in the page, so it asks the page for no room
	origin.after(block);
	wireDuplicate(block);
	return block;
}

function duplicateMap(block) {
	if (!block || !POPOUT_MQ.matches) return null;
	const mapId = block.dataset.mapId;
	const inst = freeInstance(mapId);
	dlog(`duplicateMap: ${mapId} -> ${inst}`);
	const copy = makeDuplicate(mapId, inst);
	if (!copy) return null;
	popoutMap(copy);
	const popped = block.classList.contains('popout');
	// the size of the widget it came from: its width, and its height too where
	// the height is its own (an interactive map, or a map freed of its aspect,
	// which the copy is freed of as well), held to the widget limits like a
	// stored one — a pane's width is its column's and may be wider. A map
	// copied from the page starts at the size any widget starts at
	if (popped) {
		const size = block.getBoundingClientRect();
		if (block.classList.contains('free') && !copy.classList.contains('free')) unlockAspect(copy);
		copy.style.width = `${Math.round(clamp(size.width, POPOUT_MIN_WIDTH, popoutMaxWidth()))}px`;
		if (copy.classList.contains('free'))
			copy.style.height = `${Math.round(clamp(size.height, POPOUT_MIN_HEIGHT, viewportHeight()))}px`;
	}
	// a step off the widget it came from, the way a cascade steps, so it is
	// plainly a second thing and not the first one having jumped
	const from = popped ? block.getBoundingClientRect() : copy.getBoundingClientRect();
	placePopout(copy, from.left + CASCADE_STEP, from.top + CASCADE_STEP);
	raisePopout(copy);
	fitWidget(copy);
	updateGroups();
	syncShadows();
	persistSnapLayout();
	return copy;
}

// the block a stored entry names: the plain key is the showing holding the
// page's place, whatever it is called by now (the breakpoint docks it, and it
// may have inherited the place from a #2); any other key is a copy, which
// exists only in the arrangement and so is made here as the arrangement is laid
// out — under a free name, the stored one being a position in the layout and
// not a name anything on screen still answers to. A copy of a map the list no
// longer holds has nothing to be made from, and sanitizeSnapLayout has already
// dropped it
function instanceFor(inst) {
	const mapId = instMapId(inst);
	if (instIndex(inst) === 1) return pageShowing(mapId);
	const copy = blockByInst(inst);
	return copy && isDuplicate(copy) ? copy : makeDuplicate(mapId, freeInstance(mapId));
}

// a showing closed while others of its map stay out: it goes, and if it held
// the page's place, the next showing takes the place over — the gap and its
// way back with it. Nothing moves in the DOM for that (an iframe would reload):
// every other showing is a widget, fixed, so the heir docks where the gap is
// from wherever it sits in the row
function removeShowing(block) {
	dlog(`removeShowing: ${block.dataset.inst}`);
	if (!isDuplicate(block)) {
		const heir = otherShowings(block)[0];
		if (heir) {
			heir.classList.remove('duplicate');
			if (block._gap) {
				heir._gap = block._gap;
				heir._gap._block = heir;
				delete block._gap;
			}
		}
	}
	const fs = block.querySelector('.if1.fullscreen');
	if (fs) exitFullscreen(fs);
	if (block._group) leaveGroup(block);
	unsnapPane(block);
	if (block._shadow) block._shadow.remove();
	block.remove();
	updateGroups();
	syncShadows();
	persistSnapLayout();
}

// a widget's [R] fetches its map afresh — the page may have been open long
// enough for new images to be out — without reloading the page. First in
// the cluster, shown only on a popped-out widget (CSS). Not on an
// interactive map, whose bar keeps its own [X]/[R] gate button
function buildReloadButton() {
	const btn = el('a', { class: 'rl-btn', text: '[R]', title: 'Ponovno učitaj kartu' });
	btn.addEventListener('click', () => {
		const block = btn.closest('.map-block');
		reloadMap(block);
		// the interval runs from the last time the maps were new, and one map
		// made new is all of them only when it is the only one the clock sweeps;
		// among several, the rest are as stale as they were
		const others = reloadableBlocks().filter(other => other !== block);
		if (!others.length) restartRefresh();
	});
	return btn;
}

function reloadMap(block) {
	if (!block) return;
	dlog(`reloadMap: ${block.dataset.mapId}`);
	// images and videos are re-fetched past the cache by a fresh query parameter
	block.querySelectorAll('img[src]').forEach(img => { img.src = freshUrl(img.getAttribute('src')); });
	block.querySelectorAll('video').forEach(video => {
		video.querySelectorAll('source[src]').forEach(source => { source.src = freshUrl(source.getAttribute('src')); });
		video.load();
	});
	// a plain iframe is navigated to its address again
	block.querySelectorAll('.if2 iframe[src]').forEach(iframe => { iframe.src = iframe.getAttribute('src'); });
}

// the url with a reload parameter of its own set to now (replaced when there
// is one already), so the browser fetches instead of serving its cache
function freshUrl(url) {
	const base = url.replace(/([?&])_r=\d+(&|$)/, (m, sep, next) => next ? sep : '');
	return `${base}${base.includes('?') ? '&' : '?'}_r=${Date.now()}`;
}

function popoutMap(block) {
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
	POPOUT_HANDLES.forEach(dir => block.appendChild(el('div', { class: `po-h po-h-${dir}`, 'data-dir': dir })));
	// stays where it was on screen, so it reads as lifted rather than teleported
	placePopout(block, rect.left, rect.top);
	raisePopout(block);
	block.querySelectorAll('.po-btn').forEach(btn => setPopoutButton(btn, true));
	persistSnapLayout();
}

// iframes have no intrinsic aspect, so their widgets resize in both dimensions;
// images, slideshows and videos keep the height their aspect ratio gives them
function isFreePopout(block) {
	return !!block.querySelector('.if1, .if2');
}

// a locked widget freed of its aspect: it becomes a free widget (an inline
// height, the column layout, the height stored in the layout) with the
// media letterboxed in what the title bar leaves (.letterbox, CSS) over a
// blurred and darkened copy of the image showing (.po-backdrop, the image
// in --po-img), so the bars around it are of the map and not of the frame
function unlockAspect(block) {
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
function lockToImage(block) {
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
function lockAspect(block) {
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
function syncBackdrop(block) {
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
const TITLE_GAP = 6; // kept between the title and a cluster
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
function fitWidget(block) {
	fitTitles(block);
	fitLetterbox(block);
}

function dockMap(block) {
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
function dockAllPopouts() {
	setDashboard(false);
	layoutSnapColumns();
	// one write for the lot: every dockMap would otherwise store the arrangement
	// on its way out, and the only one worth storing is the last
	withPersistPaused(() => document.querySelectorAll('.map-block.popout').forEach(dockMap));
	persistSnapLayout(); // also with nothing to dock: the mode may have changed
	syncShadows(); // the breakpoint docks with persistence paused, so the sweep is not reached through it
}

// ---------- dashboard (desktop) ----------

// the page out of sight and every map of the list a widget, floating or in a
// column — a mode of the view, `dashboard: true` on the layout, so it rides
// with the list in the preferences, a saved preset and a share link, and
// comes back with them (applySnapLayout). Which is also the only way onto it:
// the dialog's mode row ticks the mode and Primijeni applies it with the list,
// so nothing enters the board on its own. Left the same way, or by docking
// everything (Vrati sve, the breakpoint). On the board the widget's [=] is [x]
// and takes the map off the list; a map added to the list comes onto the board
// at the next free step of a cascade (popoutRest). Desktop only, like the
// widgets: the breakpoint docks everything, with persistence paused, so the
// stored view keeps the mode
let dashboardMode = false;
const CASCADE_STEP = 32; // between widgets popped out one after another with no place of their own

function isDashboard() {
	return dashboardMode;
}

// the class first: the page's scrollbar goes with it, changing the viewport
// everything after is measured in; the buttons read the mode
function setDashboard(on) {
	dashboardMode = on;
	document.body.classList.toggle('dashboard', on);
	renderGrid(); // the paper is the board's
	document.querySelectorAll('.map-block.popout .po-btn').forEach(btn => setPopoutButton(btn, true));
}

// every map of the list not popped out yet becomes a widget, one after
// another down a cascade from the top left of what the columns leave; once
// it would run off the bottom the next round starts at the top again, half
// a widget further right
function popoutRest() {
	let top = POPOUT_MARGIN, round = 0;
	document.querySelectorAll('.map-block:not(.popout)').forEach(block => {
		popoutMap(block);
		// the widget's own height says whether it still fits, but the step it
		// lands on is the cascade's own count rather than a number of steps
		// derived from that height: widgets are of every height, so a per-widget
		// count is a different modulus for each and lands several of them on the
		// very same place. The first of a round goes down whatever its height, or
		// one taller than the viewport would start a round of its own for ever
		if (top > POPOUT_MARGIN && top + block.offsetHeight > viewportHeight()) {
			top = POPOUT_MARGIN;
			round++;
		}
		placePopout(block,
			snapColumnPx(snapColumns.left) + POPOUT_MARGIN + (top - POPOUT_MARGIN) + round * POPOUT_WIDTH / 2,
			top);
		raisePopout(block);
		top += CASCADE_STEP;
	});
}

// [x] on the board, on a map's last showing: the map leaves the list it is
// shown from — the widget goes, with its rows in the (hidden) table, and the
// list is stored without it (maps.js), as the dialog would store it after the
// map was unticked
function removeFromDashboard(block) {
	dlog(`removeFromDashboard: ${block.dataset.mapId}`);
	const id = block.dataset.mapId;
	withPersistPaused(() => dockMap(block)); // out of its column and group, a fullscreen taken down
	const row = block.closest('tr');
	const next = row.nextElementSibling;
	const links = next && next.querySelector('.links-bottom') ? next : null;
	const last = links || row;
	const spacer = row.previousElementSibling && row.previousElementSibling.classList.contains('sp20') ? row.previousElementSibling
		: last.nextElementSibling && last.nextElementSibling.classList.contains('sp20') ? last.nextElementSibling : null;
	[links, spacer, row].forEach(node => { if (node) node.remove(); });
	removeMapFromList(id);
}

// the tab's [+], the other way round: the map joins the end of the list, its
// rows join the end of the (hidden) table the way the render would have laid
// them, and it comes onto the board the way any map new to the list does, at
// the cascade's first step (popoutRest — every other map is a widget already).
// Nothing is rendered again, so nothing else on the board reloads
function addToDashboard(mapId) {
	const map = catalogMap(mapId);
	const tbody = document.querySelector('tbody[data-maps]');
	if (!map || !tbody || !isDashboard() || pageShowing(mapId)) return;
	dlog(`addToDashboard: ${mapId}`);
	addMapToList(mapId);
	const empty = tbody.querySelector('.maps-empty');
	if (empty) tbody.replaceChildren(); // the "nothing selected" row
	const block = appendMapRows(tbody, map);
	const links = tbody.lastElementChild.querySelector('.links-bottom');
	if (links) links.addEventListener('scroll', () => updateLinksScrollShadow(links), { passive: true });
	wireDuplicate(block); // its own wiring and only its own, as a copy's
	popoutRest();
	fitWidget(block);
	updateGroups();
	syncShadows();
	persistSnapLayout();
	return block;
}

// ---------- the grid (desktop, on the board) ----------

// Graph paper under the widgets, and the lines a widget settles onto when let
// go. The cell is a size, not a count: the lines are its multiples, so they are
// whole pixels by construction whatever the window, the cells stay square on
// every screen, and the paper is one repeating gradient however fine it gets.
// Two edges land on the same line whenever they lie within half a cell of each
// other, so at 16 the grid forgives 8px — many times the fraction of a pixel an
// aspect-derived height leaves between two widgets, which is what makes a
// snapped board exact where a placed one is only nearly so. Both switches are the
// browser's, not the view's (mapGrid, like msTab and msPanel): they are a way
// of working, so they do not travel in a preset or a link, and they keep their
// state while the board is off, when they do nothing
const GRID_CELL = 16;
const GRID_KEY = 'mapGrid';

function loadGridPrefs() {
	try {
		const stored = JSON.parse(localStorage.getItem(GRID_KEY));
		if (stored && typeof stored === 'object') return { show: stored.show === true, snap: stored.snap === true };
	} catch (e) { /* unreadable is off */ }
	return { show: false, snap: false };
}

let { show: gridShow, snap: gridSnap } = loadGridPrefs();

function isGridShown() {
	return gridShow;
}

function isGridSnapped() {
	return gridSnap;
}

function setGridPrefs(show, snap) {
	dlog(`setGridPrefs: show=${show} snap=${snap}`);
	gridShow = show;
	gridSnap = snap;
	try {
		localStorage.setItem(GRID_KEY, JSON.stringify({ show, snap }));
	} catch (e) { /* storage disabled or full — the grid still works this session */ }
	renderGrid();
	// the switches are in three places — the dialog's ticks, the tab's [G]/[S],
	// and the keys — so the one that was not used is told. An open dialog holds
	// its own copy of them and is re-read, or its next tick would write the
	// stale one back and undo what the key or the glyph did
	const panel = document.getElementById('mapSettings');
	if (panel && !panel.hidden && panel._onGridChange) panel._onGridChange();
	syncMsTab();
}

// the paper itself: one fixed layer under the widgets and over the columns'
// ground, drawn by the CSS from the cell. The page's own far edge is no
// multiple of the cell and is not drawn — it is the edge of the screen
function renderGrid() {
	const on = gridShow && dashboardMode && POPOUT_MQ.matches;
	let grid = document.querySelector('.po-grid');
	if (!on) {
		if (grid) grid.remove();
		return;
	}
	if (!grid) {
		grid = document.createElement('div');
		grid.className = 'po-grid';
		// outside .container, which the board hides, and before the widgets in
		// the stacking order by its z-index rather than by where it sits
		document.body.appendChild(grid);
	}
	grid.style.setProperty('--grid-cell', `${GRID_CELL}px`);
}

// every multiple of the cell across the extent, and the far edge itself: the
// page's edges are lines too, and the last multiple rarely lands on one
function gridLines(extent) {
	const lines = [];
	for (let at = 0; at < extent; at += GRID_CELL) lines.push(at);
	if (lines[lines.length - 1] !== extent) lines.push(extent);
	return lines;
}

function nearestLine(lines, value) {
	let best = 0;
	for (let i = 1; i < lines.length; i++) {
		if (Math.abs(lines[i] - value) < Math.abs(lines[best] - value)) best = i;
	}
	return best;
}

// each of the four edges to its nearest line, so the widget grows or shrinks
// to fit rather than being moved as it is. The aspect is freed first: a locked
// widget's height follows its width and could never reach a line of its own,
// and at this cell the letterbox that leaves is a few pixels at most. Held to
// the widget's minimum by taking the next line out, and to at least one cell
function snapBlockToGrid(block) {
	const xs = gridLines(viewportWidth()), ys = gridLines(viewportHeight());
	const rect = block.getBoundingClientRect();
	let left = nearestLine(xs, rect.left), right = nearestLine(xs, rect.right);
	let top = nearestLine(ys, rect.top), bottom = nearestLine(ys, rect.bottom);
	if (right <= left) right = Math.min(left + 1, xs.length - 1);
	if (bottom <= top) bottom = Math.min(top + 1, ys.length - 1);
	while (xs[right] - xs[left] < POPOUT_MIN_WIDTH && (right < xs.length - 1 || left > 0)) {
		if (right < xs.length - 1) right++;
		else left--;
	}
	while (ys[bottom] - ys[top] < POPOUT_MIN_HEIGHT && (bottom < ys.length - 1 || top > 0)) {
		if (bottom < ys.length - 1) bottom++;
		else top--;
	}
	if (!block.classList.contains('free')) unlockAspect(block);
	block.style.width = `${xs[right] - xs[left]}px`;
	block.style.height = `${ys[bottom] - ys[top]}px`;
	placePopout(block, xs[left], ys[top]);
	syncBackdrop(block);
	fitWidget(block);
}

// on release only, never while the gesture runs: the widget follows the
// pointer and settles onto the grid when it is let go
function snapToGrid(blocks) {
	if (!gridSnap || !dashboardMode || !POPOUT_MQ.matches) return;
	blocks.forEach(block => {
		if (!block.classList.contains('fs-host')) snapBlockToGrid(block);
	});
}

// ---------- arranging the board ----------

// Every widget the same size, tiled edge to edge over the whole board. It is
// what a board left running for the room to glance at wants — none of the
// screen spent on gaps, and nothing to line up by hand — and it is what makes
// the seams useful: tiled with no gap, every inside edge is one.
//
// The widgets are freed on the way. "The same size" and "the shape its image
// has" cannot both hold: given one width, locked widgets come out at as many
// heights as there are maps and no row would line up. A freed widget
// letterboxes its map over a blurred copy of it, and the double-click on the
// bar is the way back to its own shape, one map at a time.
const ARRANGE_ASPECT = 4 / 3; // a map's shape, near enough, when there are none to measure
const ARRANGE_HOLE = 0.01; // the share of a map's size an empty cell costs: a tie-breaker, no more

// how many columns n widgets go in: the shape that shows each map biggest. A
// map is contained in what its cell leaves under the title bar, so its size is
// the cell's area only when the cell has the map's shape, and too wide or too
// tall a cell is spent on ground. That is what the eye asks of a board — ten
// maps go 4x3 with two holes rather than 2x5 in strips too thin to read, or
// 5x2 when the maps are square enough to be bigger that way. An empty cell
// costs a hair, so a tidy 3x3 is not passed over for a 4x3 whose maps come
// out the same size. Falls out as 2x2 for four, 3x2 for six and 4x3 for
// twelve, and on a wide screen puts two side by side rather than one above
// the other
function arrangeShape(n, width, height, aspect) {
	let best = { cols: 1, rows: n, score: -Infinity };
	for (let cols = 1; cols <= n; cols++) {
		const rows = Math.ceil(n / cols);
		const w = width / cols, h = height / rows - POPOUT_TITLE_HEIGHT;
		if (h <= 0) continue;
		const mapWidth = Math.min(w, h * aspect);
		const score = mapWidth * (mapWidth / aspect) * (1 - (cols * rows - n) * ARRANGE_HOLE);
		if (score > best.score) best = { cols, rows, score };
	}
	return best;
}

// the shape of what a widget shows: the image's or the video's own, or, for a
// locked widget of anything else, what its map takes of it under the bar. A
// freed widget's rect is not measured — it is the cell a previous arrangement
// cut, and reading it back would hand the next one the same shape whatever the
// maps are. A freed frame has no shape of its own and fills any cell, so it
// has no say
function mapAspect(block) {
	const img = block.querySelector('.slide.active img') || block.querySelector('.placeholder img');
	if (img && img.naturalWidth && img.naturalHeight) return img.naturalWidth / img.naturalHeight;
	const video = block.querySelector('video');
	if (video && video.videoWidth && video.videoHeight) return video.videoWidth / video.videoHeight;
	if (block.classList.contains('free')) return 0;
	const r = block.getBoundingClientRect();
	const h = r.height - POPOUT_TITLE_HEIGHT;
	return h > 0 ? r.width / h : 0;
}

// the maps' shape, averaged, so the cells are cut to fit what goes in them
function arrangeAspect(blocks) {
	const ratios = blocks.map(mapAspect).filter(ratio => ratio > 0);
	return ratios.length ? ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length : ARRANGE_ASPECT;
}

// n whole numbers summing to total, the remainder over the first of them: a
// fraction left on any cell would leave a hairline between two tiles, and a
// hairline is the difference between an edge that is a seam and one that is not
function shareOut(total, n) {
	const base = Math.floor(total / n);
	const extra = Math.round(total) - base * n;
	return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

function runningTotal(sizes, upTo) {
	return sizes.slice(0, upTo).reduce((sum, size) => sum + size, 0);
}

// left to right and top to bottom in the order of the list, so the board reads
// the way the picker does. The last row carries the remainder and is not
// stretched to fill it: a wider tile there would be the one thing on the board
// unlike the others
function arrangeBoard() {
	if (!isDashboard() || !POPOUT_MQ.matches) return;
	// in the list's order, which is the DOM's; on a board every map is a widget
	const blocks = [...document.querySelectorAll('.map-block.popout')]
		.filter(block => !isSnapped(block) && !block.classList.contains('fs-host'));
	if (!blocks.length) return;
	dlog(`arrangeBoard: ${blocks.length} widgets`);
	const width = viewportWidth(), height = viewportHeight();
	const { cols, rows } = arrangeShape(blocks.length, width, height, arrangeAspect(blocks));
	const widths = shareOut(width, cols);
	const heights = shareOut(height, rows);
	blocks.forEach((block, i) => {
		unlockAspect(block);
		block.style.width = `${widths[i % cols]}px`;
		block.style.height = `${heights[Math.floor(i / cols)]}px`;
	});
	// placed after every size is set, so the reads below are one layout and not
	// one per widget, and each tile is placed against sizes that are already final
	blocks.forEach((block, i) => {
		placePopout(block, runningTotal(widths, i % cols), runningTotal(heights, Math.floor(i / cols)));
		fitWidget(block);
	});
	updateGroups();
	syncShadows();
	persistSnapLayout();
}

// the widest a widget goes: the table's width over the page, which is where
// that cap comes from, and the whole viewport on the board, which has no table
// to relate to — a board of half-width tiles needs more than 875 of a wide screen
function popoutMaxWidth() {
	return dashboardMode ? viewportWidth() : Math.min(POPOUT_MAX_WIDTH, viewportWidth() - POPOUT_MARGIN);
}

// keep the whole widget inside the viewport when it fits, else at least its
// top-left corner so the title bar can always be grabbed
function placePopout(block, left, top) {
	const maxLeft = Math.max(0, viewportWidth() - block.offsetWidth);
	const maxTop = Math.max(0, viewportHeight() - Math.max(block.offsetHeight, POPOUT_TITLE_HEIGHT));
	block.style.left = `${subpixel(Math.min(Math.max(0, left), maxLeft))}px`;
	block.style.top = `${subpixel(Math.min(Math.max(0, top), maxTop))}px`;
}

// a grouped widget comes up with its group, the order within it kept
function raisePopout(block) {
	groupMembers(block)
		.sort((a, b) => (Number(a.style.zIndex) || 0) - (Number(b.style.zIndex) || 0))
		.forEach(member => member.style.zIndex = ++popoutZ);
	updateCovered();
}

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
function updateCovered() {
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

// ---------- the shadow layer (desktop) ----------

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
function syncShadows() {
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

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), Math.max(min, max));
}

// the layout viewport: innerWidth counts the vertical scrollbar, under which
// a widget's right edge (and a right column) would then land — and so does
// clientWidth while a dialog keeps the scrollbar's gutter in its place. The
// gutter is the dialog chrome's (main.js) and is asked for rather than read:
// this file runs before that one, and a call made in between gets the 0 that
// is true of a page with no dialog up
function viewportWidth() {
	return document.documentElement.clientWidth
		- (typeof dialogGutterPx === 'function' ? dialogGutterPx() : 0);
}

function viewportHeight() {
	return document.documentElement.clientHeight;
}

// a pointer gesture on a widget: move/up listeners on document (mouse only,
// nothing moves in the DOM — compare the picker drag in the settings panel),
// and .po-dragging turns iframe pointer events off so the pointer is not
// swallowed when it crosses one mid-gesture. onEnd runs once the pointer is
// released (or the gesture cancelled)
function trackPopoutPointer(e, onMove, onEnd) {
	const startX = e.clientX, startY = e.clientY;
	let dx = 0, dy = 0, at = e; // where the pointer was left, for the key to repeat
	// the shadows follow the gesture live: every drag and resize of a widget, a
	// group, a pane and a column comes through here, and updateCovered — which
	// syncs them otherwise — runs only once the gesture is over
	const move = (ev) => { at = ev; dx = ev.clientX - startX; dy = ev.clientY - startY; onMove(dx, dy, ev); syncShadows(); };
	// Shift is answered while the gesture runs and not only as it stood when it
	// began (resizePopout): the last move is made again with the key as it now
	// is, so a pull already under way changes what it does the moment the key
	// goes down or comes up, with the pointer held still. A KeyboardEvent
	// carries no coordinates, so the pointer's last stand in — the same move
	// over again, which every onMove here takes without moving anything
	const key = (ev) => {
		if (ev.key !== 'Shift' || ev.repeat) return;
		onMove(dx, dy, { clientX: at.clientX, clientY: at.clientY, shiftKey: ev.type === 'keydown' });
		syncShadows();
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

// the widget follows the pointer by the point of the title bar it was grabbed
// at. Once its edge reaches a viewport edge (wherever it is held — the place
// the pointer asks for is checked, not the clamped one, so pushing on past
// the edge still counts) it has a snap slot, previewed and taken on release.
// A snapped pane moves up and down its column until the drag is decidedly
// sideways, then floats again as it stood, the title bar kept under the
// pointer. Away from the viewport edges the other floating widgets are
// magnets: an edge brought close to one of theirs is pulled onto it. A
// grouped widget takes its group along: the members move by one offset, and
// the magnets, the viewport and the column snap see the group's bounding
// box in place of the widget held
function dragPopout(block, e) {
	let rect = block.getBoundingClientRect();
	const grab = { x: e.clientX - rect.left, y: e.clientY - rect.top };
	const members = groupMembers(block); // the widget alone when not grouped
	let starts = groupStarts(members), box = groupBox(starts);
	let col = snapColumnOf(block); // a group's members share it
	const magnets = magnetRects(block, members); // the others stay put for the drag
	let target = null;
	trackPopoutPointer(e, (dx, dy, ev) => {
		// a click on a parked widget must not move, snap or be pulled anywhere
		const armed = Math.hypot(dx, dy) >= SNAP_ARM;
		if (col) {
			if (Math.abs(dx) < SNAP_DETACH) {
				if (armed) movePanes(col, starts, box, dy);
				return;
			}
			// out of the column: the members float where they stand, measured
			// afresh, the title bar kept under the pointer
			members.forEach(unsnapPane);
			col = null;
			rect = block.getBoundingClientRect();
			grab.x = Math.min(grab.x, block.offsetWidth - POPOUT_TITLE_HEIGHT);
			grab.y = clamp(ev.clientY - rect.top, 0, POPOUT_TITLE_HEIGHT);
			starts = groupStarts(members);
			box = groupBox(starts);
		}
		// where the box is asked to go, off the widget held
		let boxLeft = box.left + ev.clientX - grab.x - rect.left, boxTop = box.top + ev.clientY - grab.y - rect.top;
		const side = armed ? snapSideAt(boxLeft, boxLeft + box.width) : null;
		target = side ? { side, slot: snapSlot(members, side, boxTop) } : null;
		if (armed && !target) ({ left: boxLeft, top: boxTop } = magnetPosition(magnets, boxLeft, boxTop, box.width, box.height));
		moveGroup(starts, box, boxLeft - box.left, boxTop - box.top);
		showSnapPreview(target ? target.slot : null);
	}, () => {
		showSnapPreview(null);
		if (target) { snapPanes(byPlace(members), target.side, target.slot); return; }
		snapToGrid(members); // on release, not during: the drag itself stays free
		persistSnapLayout();
	});
}

// top to bottom, then left to right: the order a stack is made in
function byPlace(blocks) {
	return [...blocks].sort((a, b) => {
		const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
		return ra.top - rb.top || ra.left - rb.left;
	});
}

// the widgets floating over the page other than this one and the others
// moving with it — a pane is out of reach in its column, and a widget hosting
// a fullscreen map is not to be seen
function magnetRects(block, along = []) {
	return floatingBlocks()
		.filter(other => other !== block && !along.includes(other) && !other.classList.contains('fs-host'))
		.map(other => other.getBoundingClientRect());
}

// where a widget of this size asked to left/top is pulled to. An edge within
// MAGNET of another widget's opposite edge meets it — beside it when the two
// overlap in height, above or below it when they overlap in width — and once
// they meet on one axis the nearer of the like edges lines up on the other,
// so a widget dropped below another sits flush with its left or right side.
// The closest edge wins on each axis; nothing within reach leaves the widget
// where it was asked
function magnetPosition(rects, left, top, width, height) {
	const right = left + width, bottom = top + height;
	// the candidate carrying the closest edge within reach, with its widget
	const pull = (value, candidates) => {
		const edge = magnetEdge(value, candidates.map(c => c[0]));
		return edge === null ? null : candidates.find(c => c[0] === edge);
	};
	const beside = rects.filter(r => top < r.bottom && bottom > r.top);
	const stacked = rects.filter(r => left < r.right && right > r.left);
	let x = pull(left, beside.flatMap(r => [[r.right, r], [r.left - width, r]]));
	let y = pull(top, stacked.flatMap(r => [[r.bottom, r], [r.top - height, r]]));
	if (x && !y) y = pull(top, [[x[1].top, x[1]], [x[1].bottom - height, x[1]]]);
	if (y && !x) x = pull(left, [[y[1].left, y[1]], [y[1].right - width, y[1]]]);
	return { left: x ? x[0] : left, top: y ? y[0] : top };
}

// the closest of the edges within MAGNET of value, null when none is
function magnetEdge(value, edges) {
	let best = null;
	edges.forEach(edge => {
		if (Math.abs(edge - value) <= MAGNET && (best === null || Math.abs(edge - value) < Math.abs(best - value))) best = edge;
	});
	return best;
}

// ---------- groups ----------

// widgets that touch (an edge of one on an edge of the other, the two
// overlapping along it — what the magnets leave) can be grouped: the group
// drags and raises as one, each member still resizes on its own. The title
// bar's [+] joins a widget with what it touches (and their groups, into
// one), [-] takes it out again; a group left with one member is no group.
// Explicit only: touching alone groups nothing. Widgets touch in one place —
// floating over the page, or panes of the same column — so a group is always
// in one place, and goes into or out of a column as one. A group lives in
// block._group (an id shared by its members) and rides in the stored layout
// as a group number on each member's entry. Docking a member takes it out.
let groupSeq = 0;

function allPopouts() {
	return [...document.querySelectorAll('.map-block.popout')];
}

function floatingBlocks() {
	return [...document.querySelectorAll('.map-block.popout:not(.snapped)')];
}

function groupMembers(block) {
	return block._group ? allPopouts().filter(b => b._group === block._group) : [block];
}

// the widgets a block can touch: the others in its place
function placeMates(block) {
	const col = snapColumnOf(block);
	return (col ? col.panes.map(p => p.block) : floatingBlocks()).filter(other => other !== block);
}

function buildGroupButton() {
	const btn = el('a', { class: 'grp-btn', hidden: '' });
	btn.addEventListener('click', () => toggleGroup(btn.closest('.map-block')));
	return btn;
}

function toggleGroup(block) {
	if (!block || !block.classList.contains('popout')) return;
	if (block._group) leaveGroup(block);
	else joinGroup(block);
	persistSnapLayout();
}

function rectsTouch(a, b) {
	const alongY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0;
	const alongX = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0;
	const near = (p, q) => Math.abs(p - q) <= GROUP_TOUCH;
	return (alongY && (near(a.right, b.left) || near(a.left, b.right)))
		|| (alongX && (near(a.bottom, b.top) || near(a.top, b.bottom)));
}

function touchingBlocks(block) {
	const rect = block.getBoundingClientRect();
	return placeMates(block).filter(other =>
		!other.classList.contains('fs-host') && rectsTouch(rect, other.getBoundingClientRect()));
}

function joinGroup(block) {
	dlog(`joinGroup: ${block.dataset.mapId}`);
	const touched = touchingBlocks(block);
	if (!touched.length) return;
	// one group out of the widget, what it touches and the groups those are in
	const ids = new Set(touched.map(b => b._group).filter(Boolean));
	const id = ids.values().next().value || `g${++groupSeq}`;
	allPopouts().forEach(b => { if (b._group && ids.has(b._group)) b._group = id; });
	touched.forEach(b => b._group = id);
	block._group = id;
	updateGroups();
}

// a member leaves; what is left with one member is no group. In a column a
// group is a stack, so a middle member leaving splits it in two, the members
// above it and the ones below, each a group of its own if two or more
function leaveGroup(block) {
	dlog(`leaveGroup: ${block.dataset.mapId}`);
	const id = block._group;
	delete block._group;
	const rest = allPopouts().filter(b => b._group === id);
	const col = snapColumnOf(block);
	const below = col ? rest.filter(b => snapPaneOf(b).top > snapPaneOf(block).top) : [];
	if (below.length && below.length < rest.length) {
		const split = `g${++groupSeq}`;
		below.forEach(b => b._group = split);
	}
	[rest.filter(b => !below.includes(b)), below].forEach(part => {
		if (part.length < 2) part.forEach(b => delete b._group);
	});
	updateGroups();
}

// the grouped mark and the button on every widget: [-] on a member, [+] on a
// widget touching another, nothing where there is nothing to do
function updateGroups() {
	allPopouts().forEach(block => {
		const grouped = !!block._group;
		block.classList.toggle('grouped', grouped);
		const can = grouped || touchingBlocks(block).length > 0;
		block.querySelectorAll('.grp-btn').forEach(btn => {
			btn.hidden = !can;
			btn.textContent = grouped ? '[-]' : '[+]';
			btn.title = grouped ? 'Odvoji prozor od skupine' : 'Spoji prozor s prozorima koje dodiruje';
		});
		fitWidget(block); // the cluster may have changed width
	});
}

// where the members stand, to move them from
function groupStarts(members) {
	return members.map(block => {
		const rect = block.getBoundingClientRect();
		return { block, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
	});
}

function groupBox(starts) {
	const left = Math.min(...starts.map(s => s.left)), top = Math.min(...starts.map(s => s.top));
	const right = Math.max(...starts.map(s => s.right)), bottom = Math.max(...starts.map(s => s.bottom));
	return { left, top, width: right - left, height: bottom - top };
}

// the members moved by one offset, the group's box kept inside the viewport
// when it fits, else at least its top-left corner — placePopout()'s rule.
// The offset is not rounded to whole pixels: a locked widget's height is its
// title bar plus the width over its aspect, so its bottom edge lands on a
// fraction of a pixel, and a widget magneted under it would sit half a pixel
// into it — both borders drawn, a seam of about one and a half. Only a landing
// on such an edge carries a fraction (a width is whole, so the sides are too),
// and it costs that widget's border no more than the crispness of sitting on
// the grid. Thousandths: the layout unit is 1/64px
function moveGroup(starts, box, dx, dy) {
	const left = Math.min(Math.max(0, box.left + dx), Math.max(0, viewportWidth() - box.width));
	const top = Math.min(Math.max(0, box.top + dy), Math.max(0, viewportHeight() - box.height));
	dx = left - box.left;
	dy = top - box.top;
	starts.forEach(s => {
		s.block.style.left = `${subpixel(s.left + dx)}px`;
		s.block.style.top = `${subpixel(s.top + dy)}px`;
	});
}

// a position as written: thousandths of a pixel, the layout unit being 1/64px.
// Whole pixels would cost the magnets their landing (see moveGroup)
function subpixel(v) {
	return Math.round(v * 1000) / 1000;
}

// resizing from any side or corner. Width is the dimension every widget has; a
// locked (aspect) widget derives its height from it, so a pull on its top or
// bottom edge is turned into the width that gives that height, and a corner
// follows whichever axis asks for more. Pulling the left or top edge keeps the
// opposite edge where it is by moving the widget along. The pulled edge is drawn
// by the other floating widgets too (magnets, as on drag): onto the facing edge
// of one beside it, or into line with the like edge of one above or below it —
// exact for a width, and through the aspect ratio for a locked widget's height,
// whose width then has a moving edge of its own to pull, so the widget lines up
// by that edge too. A free pane in a column keeps the column's width: its top or
// bottom edge is drawn to the column's ends and the other panes, and the top it
// carries follows. A grouped floating widget's handles resize the whole group
// (resizeGroup); a grouped pane resizes on its own in its stack, which keeps
// together — the members above it move up with its top edge, the ones below down
// with its bottom edge (the settle in layoutSnapColumn), and the stack's ends
// stop at the column's
// ---------- seams ----------

// Two widgets edge to edge with the shared edge running the whole of both
// sides: then it is a seam, and dragging it moves it — one side giving what
// the other takes, the pair keeping the room it had and everything around them
// left where it stands. It is what a tiled board is for, and it settles a press
// that was always ambiguous: the two widgets' handles lie on top of each other
// along that edge, so which of them was grabbed came down to which was raised
// last. Either one now means the same thing.
//
// A side handle only, never a corner: a corner belongs to two edges at once and
// to however many widgets meet there. And whole edges only — a seam between
// sides of unequal length cannot move without tearing one of them off the
// neighbours it meets further along.
const SEAM_ALIGN = GROUP_TOUCH;

function seamNeighbour(block, dir) {
	if (dir.length !== 1 || isSnapped(block) || block.classList.contains('fs-host')) return null;
	const a = block.getBoundingClientRect();
	const near = (p, q) => Math.abs(p - q) <= SEAM_ALIGN;
	const found = floatingBlocks().filter(other => {
		if (other === block || other.classList.contains('fs-host')) return false;
		const b = other.getBoundingClientRect();
		if (dir === 'e' || dir === 'w') {
			const meets = dir === 'e' ? near(b.left, a.right) : near(b.right, a.left);
			return meets && near(b.top, a.top) && near(b.bottom, a.bottom);
		}
		const meets = dir === 's' ? near(b.top, a.bottom) : near(b.bottom, a.top);
		return meets && near(b.left, a.left) && near(b.right, a.right);
	});
	// two of them is no seam: the edge would be one widget's on one side and
	// two widgets' on the other, and there would be no saying which to move
	return found.length === 1 ? found[0] : null;
}

function resizeSeam(block, other, dir, e) {
	dlog(`resizeSeam: ${block.dataset.mapId} | ${other.dataset.mapId} (${dir})`);
	const sideways = dir === 'e' || dir === 'w';
	// the two sizes have to move on their own here, and a locked widget's height
	// follows its width — the seam would come apart under the gesture that moves it
	unlockAspect(block);
	unlockAspect(other);
	const ra = block.getBoundingClientRect(), rb = other.getBoundingClientRect();
	// named by where they lie and not by which was grabbed, so the arithmetic
	// below is the same whichever of the two handles the press landed on
	const [first, second] = sideways
		? (ra.left <= rb.left ? [block, other] : [other, block])
		: (ra.top <= rb.top ? [block, other] : [other, block]);
	const rf = first.getBoundingClientRect(), rs = second.getBoundingClientRect();
	const firstSize = sideways ? rf.width : rf.height;
	const secondSize = sideways ? rs.width : rs.height;
	const secondAt = sideways ? rs.left : rs.top;
	const min = sideways ? POPOUT_MIN_WIDTH : POPOUT_MIN_HEIGHT;
	// the seam is pulled onto the like edges of the rest of the board, as a
	// single edge is: a seam lined up with the one in the row above is most of
	// what a tiled board asks of it
	const edges = magnetRects(first, [second]).flatMap(r => sideways ? [r.left, r.right] : [r.top, r.bottom]);
	trackPopoutPointer(e, (dx, dy) => {
		let move = sideways ? dx : dy;
		const pulled = magnetEdge(secondAt + move, edges);
		if (pulled !== null) move = pulled - secondAt;
		// held so neither side goes under its minimum, which is what keeps the
		// seam inside the pair rather than pushing it out the far end
		move = clamp(move, min - firstSize, secondSize - min);
		if (sideways) {
			first.style.width = `${Math.round(firstSize + move)}px`;
			second.style.width = `${Math.round(secondSize - move)}px`;
			second.style.left = `${Math.round(secondAt + move)}px`;
		} else {
			first.style.height = `${Math.round(firstSize + move)}px`;
			second.style.height = `${Math.round(secondSize - move)}px`;
			second.style.top = `${Math.round(secondAt + move)}px`;
		}
		// both, and fitWidget rather than fitTitles: a letterboxed widget holds
		// its arrows and indicators to the image's rect, which has just moved
		fitWidget(first);
		fitWidget(second);
	}, () => {
		// each edge to its nearest line, and the shared one is the same value
		// for both, so the two land on the same line and stay a seam
		snapToGrid([first, second]);
		updateGroups();
		persistSnapLayout();
	});
}

function resizePopout(block, dir, e) {
	const members = groupMembers(block);
	const col = snapColumnOf(block);
	if (members.length > 1 && !col) return resizeGroup(members, dir, e);
	// Shift holds the aspect and a plain pull is free of it, the way round an
	// image editor has it. The key is read through the gesture rather than at the
	// start of it: press or release it mid-pull and the rest of the pull answers,
	// the widget taking its aspect back or letting it go where it stands, so what
	// it is left as is what the key said when it was let go. The pointer need not
	// move for this — trackPopoutPointer repeats the last move on the key itself.
	// In a column the width is the column's, so the height is the only thing a
	// pull can change and letting the aspect go is the only way to change it: a
	// plain pull frees a locked pane, as it does over the page, and Shift holds
	// the aspect and with it the pane. The double-click on the title bar is the
	// way back to the aspect, there as anywhere.
	let ratio;
	const setMode = (shift) => {
		if (col) {
			if (shift || block.classList.contains('free')) return;
			unlockAspect(block);
			snapPaneOf(block).height = block.offsetHeight / viewportHeight(); // a free pane carries its own
			return;
		}
		if (!shift && !block.classList.contains('free')) unlockAspect(block);
		else if (shift && block.classList.contains('letterbox')) {
			lockAspect(block);
			// the aspect it takes back is its content's, not the shape a free
			// pull left it in, so lockedWidthFor is re-seeded from what it now is
			const r = block.getBoundingClientRect();
			ratio = r.width / r.height;
		}
	};
	setMode(e.shiftKey);
	const start = block.getBoundingClientRect();
	ratio = start.width / start.height;
	// one ceiling for both axes, the map following the widget to any width it is
	// pulled to. What the pulled edge may reach is the room between the edge that
	// is not moving and the viewport edge it is pulled towards, and it is the
	// size that is held to that room rather than the widget put back inside the
	// viewport afterwards — which would move the edge that is not being dragged.
	// No margin is kept off the viewport edge here, so either axis can be filled
	// to it; placePopout keeps its own clamp. A widget always starts inside the
	// viewport (placePopout sees to it), so the room is never less than the side
	// it is the room for, and no gesture is forced to shrink one
	const ceiling = popoutMaxWidth();
	const maxWidth = Math.min(ceiling, dir.includes('w') ? start.right : viewportWidth() - start.left);
	const maxHeight = dir.includes('n') ? start.bottom : viewportHeight() - start.top;
	const magnets = col ? [] : magnetRects(block);
	const mates = col ? groupStarts(members.filter(m => m !== block)) : [];
	const above = mates.filter(s => s.top < start.top), below = mates.filter(s => s.top > start.top);
	const stackTop = Math.min(start.top, ...above.map(s => s.top));
	const stackBottom = Math.max(start.bottom, ...below.map(s => s.bottom));
	trackPopoutPointer(e, (dx, dy, ev) => {
		setMode(ev.shiftKey); // the key as it is now, not as it was at the start
		const free = block.classList.contains('free');
		let w = start.width, h = start.height;
		if (dir.includes('e')) w = start.width + dx;
		if (dir.includes('w')) w = start.width - dx;
		if (dir.includes('s')) h = start.height + dy;
		if (dir.includes('n')) h = start.height - dy;
		if (col) {
			if (!free) return; // Shift is holding the aspect, so the column gives the height
			const edges = paneMagnetEdges(col, members); // the stack moves along, so it is no magnet
			if (dir.includes('s')) { const m = magnetEdge(start.top + h, edges); if (m !== null) h = m - start.top; }
			if (dir.includes('n')) { const m = magnetEdge(start.bottom - h, edges); if (m !== null) h = start.bottom - m; }
			h = clamp(h, POPOUT_MIN_HEIGHT, start.height + (dir.includes('n') ? stackTop : viewportHeight() - stackBottom));
			const pane = snapPaneOf(block);
			pane.height = h / viewportHeight();
			pane.top = (dir.includes('n') ? start.bottom - h : start.top) / viewportHeight();
			if (dir.includes('n')) above.forEach(s => { snapPaneOf(s.block).top = (s.top - (h - start.height)) / viewportHeight(); });
			layoutSnapColumns();
			return;
		}
		({ w, h } = pullResizeEdges(magnets, dir, start, w, h));
		if (free) {
			w = clamp(w, POPOUT_MIN_WIDTH, maxWidth);
			h = clamp(h, POPOUT_MIN_HEIGHT, maxHeight);
			block.style.height = `${Math.round(h)}px`;
		} else {
			// the width the wanted height asks for, read off the widget rather
			// than taken from the start ratio, so the pulled edge lands on its
			// magnet and a plain drag follows the pointer (lockedWidthFor)
			if (dir === 'n' || dir === 's') w = lockedWidthFor(block, h, h * ratio, ratio, maxWidth);
			else if (dir.length === 2) w = Math.max(w, lockedWidthFor(block, h, h * ratio, ratio, maxWidth));
			// the width the height asked for moves the right edge (the left, pulled from the west)
			if (!(dir.includes('e') || dir.includes('w')) || dir.length === 2)
				w = pullResizeEdges(magnets, dir.includes('w') ? 'w' : 'e', start, w, h).w;
			w = clamp(w, POPOUT_MIN_WIDTH, maxWidth);
			// and the same the other way about: a width pulled by a side handle
			// carries the bottom edge down with it, since a locked height follows
			// the width, so that edge is offered the same magnets and the width
			// is taken back from the height that lands on one — which is how a
			// widget widened beside a taller one stops level with its bottom
			if (dir !== 'n' && dir !== 's') {
				const vert = (dir.includes('n') ? 'n' : 's') + (dir.includes('w') ? 'w' : '');
				const at = lockedHeightAt(block, w);
				const want = pullResizeEdges(magnets, vert, start, w, at).h; // the height only; the width has had its pull
				if (Math.abs(want - at) > 0.5) w = lockedWidthFor(block, want, w + (want - at) * ratio, ratio, maxWidth);
			}
			// and the room is a height, which locked is a width as well: the
			// widest the widget stands inside it, so the aspect cannot carry the
			// height off the bottom of the screen
			if (lockedHeightAt(block, w) > maxHeight + 0.5)
				w = lockedWidthFor(block, maxHeight, maxHeight * ratio, ratio, maxWidth);
		}
		block.style.width = `${Math.round(w)}px`;
		// the laid-out height, exact for locked widgets where it follows the
		// width — off the rect, like start, so the two can be subtracted without
		// offsetHeight's rounding costing the north edge a pixel
		h = block.getBoundingClientRect().height;
		placePopout(block, dir.includes('w') ? start.right - w : start.left, dir.includes('n') ? start.bottom - h : start.top);
		fitWidget(block);
	}, () => { snapToGrid([block]); persistSnapLayout(); });
}

// the pulled edges of something that started as start (left/top/right/
// bottom) and is asked to be w by h, drawn by the magnets: onto the facing
// edge of a widget beside it (above or below it, for a top or bottom edge)
// or into line with the like edge of one above or below it (beside it, for a
// top or bottom edge)
function pullResizeEdges(magnets, dir, start, w, h) {
	const left = dir.includes('w') ? start.right - w : start.left;
	const top = dir.includes('n') ? start.bottom - h : start.top;
	const beside = magnets.filter(r => top < r.bottom && top + h > r.top);
	const stacked = magnets.filter(r => left < r.right && left + w > r.left);
	const edge = (value, meet, align) => { const m = magnetEdge(value, meet.concat(align)); return m === null ? value : m; };
	if (dir.includes('e')) w = edge(start.left + w, beside.map(r => r.left), stacked.map(r => r.right)) - start.left;
	if (dir.includes('w')) w = start.right - edge(start.right - w, beside.map(r => r.right), stacked.map(r => r.left));
	if (dir.includes('s')) h = edge(start.top + h, stacked.map(r => r.top), beside.map(r => r.bottom)) - start.top;
	if (dir.includes('n')) h = start.bottom - edge(start.bottom - h, stacked.map(r => r.bottom), beside.map(r => r.top));
	return { w, h };
}

// the width at which a locked widget stands exactly h high. Its height is its
// title bar and indicators, which keep their height whatever the width, plus
// the map, which scales with it — so height is not proportional to width, and
// a ratio only approximates the width a wanted height asks for: it is out by
// about the bar's share of the height, a dozen pixels, which is the whole of
// MAGNET. Setting the width and reading back the height it gave closes that,
// since the error left is the bar's share of the error — under a tenth — so
// the second pass lands on the pixel. Cheap enough per move: the height is read
// back once anyway
function lockedWidthFor(block, h, w, ratio, maxWidth) {
	for (let i = 0; i < 3; i++) {
		w = clamp(w, POPOUT_MIN_WIDTH, maxWidth);
		const got = lockedHeightAt(block, w);
		if (Math.abs(got - h) < 0.5) break;
		w += (h - got) * ratio;
	}
	return clamp(w, POPOUT_MIN_WIDTH, maxWidth);
}

// the height a locked widget stands at that width. Off the rect, not
// offsetHeight: the width is a whole pixel and the height it gives is not, and
// a rounded reading would keep a pixel of the error
function lockedHeightAt(block, w) {
	block.style.width = `${Math.round(w)}px`;
	return block.getBoundingClientRect().height;
}

// a group resizes as one thing: its box is pulled as a locked widget's is —
// one scale for the whole, from the pulled axis, a corner following whichever
// asks for more — from the edge or corner opposite the one pulled, the other
// widgets its magnets. Every member is scaled by it (a free one in height
// too; a locked one's height follows its width, with the title bar not
// scaling along), then placed at its scaled offset and settled onto the
// members it touched or lined up with before (groupRelations), so a stack
// stays a stack whatever the title bars do
function resizeGroup(members, dir, e) {
	const starts = groupStarts(members);
	starts.forEach(s => {
		s.width = s.right - s.left;
		s.height = s.bottom - s.top;
		s.free = s.block.classList.contains('free');
	});
	const box = groupBox(starts);
	box.right = box.left + box.width;
	box.bottom = box.top + box.height;
	const relations = groupRelations(starts);
	const order = [...starts].sort((a, b) => a.top - b.top || a.left - b.left);
	const magnets = magnetRects(members[0], members);
	// the anchor: the box grows from the edge or corner opposite the one pulled
	const ax = dir.includes('w') ? box.right : box.left;
	const ay = dir.includes('n') ? box.bottom : box.top;
	// no member under its minimum or over the widest a widget may be, and the box inside the viewport
	const minScale = Math.max(
		POPOUT_MIN_WIDTH / Math.min(...starts.map(s => s.width)),
		...starts.filter(s => s.free).map(s => POPOUT_MIN_HEIGHT / s.height));
	const maxScale = Math.min(
		// no member past the widest a widget may be
		popoutMaxWidth() / Math.max(...starts.map(s => s.width)),
		(dir.includes('w') ? box.right : viewportWidth() - box.left) / box.width,
		(dir.includes('n') ? box.bottom : viewportHeight() - box.top) / box.height);
	trackPopoutPointer(e, (dx, dy) => {
		let w = box.width, h = box.height;
		if (dir.includes('e')) w = box.width + dx;
		if (dir.includes('w')) w = box.width - dx;
		if (dir.includes('s')) h = box.height + dy;
		if (dir.includes('n')) h = box.height - dy;
		({ w, h } = pullResizeEdges(magnets, dir, box, w, h));
		let scale = dir === 'n' || dir === 's' ? h / box.height
			: dir.length === 2 ? Math.max(w / box.width, h / box.height)
			: w / box.width;
		scale = clamp(scale, minScale, Math.max(minScale, maxScale));
		starts.forEach(s => {
			s.block.style.width = `${Math.round(s.width * scale)}px`;
			if (s.free) s.block.style.height = `${Math.round(s.height * scale)}px`;
		});
		const placed = [];
		order.forEach(s => {
			let left = ax + (s.left - ax) * scale, top = ay + (s.top - ay) * scale;
			const width = s.block.offsetWidth, height = s.block.offsetHeight;
			relations.filter(r => r.to === s && placed.includes(r.from)).forEach(r => {
				const a = r.from.block.getBoundingClientRect();
				if (r.kind === 'below') top = a.bottom;
				else if (r.kind === 'above') top = a.top - height;
				else if (r.kind === 'right') left = a.right;
				else if (r.kind === 'left') left = a.left - width;
				else if (r.kind === 'alignLeft') left = a.left;
				else if (r.kind === 'alignRight') left = a.right - width;
				else if (r.kind === 'alignTop') top = a.top;
				else if (r.kind === 'alignBottom') top = a.bottom - height;
			});
			s.block.style.left = `${Math.round(left)}px`;
			s.block.style.top = `${Math.round(top)}px`;
			placed.push(s);
		});
		// fitWidget, not fitTitles alone: a letterboxed member's arrows and
		// indicators are held to the image's rect (--lb-*, fitLetterbox), so left
		// unmeasured through the gesture they keep the width the image had before
		// it — the group shrinking under indicators that do not
		members.forEach(fitWidget);
	}, () => { snapToGrid(members); persistSnapLayout(); });
}

// how the members stand to one another: for every ordered pair that touches,
// which edge of `to` lies on which of `from` (below: to's top on from's
// bottom, and so on), and, along that edge, which like edges line up. The
// alignments come first, the touch last, so it wins where both pull one axis
function groupRelations(starts) {
	const near = (p, q) => Math.abs(p - q) <= GROUP_TOUCH;
	const relations = [];
	starts.forEach(from => starts.forEach(to => {
		if (from === to) return;
		const alongX = Math.min(from.right, to.right) - Math.max(from.left, to.left) > 0;
		const alongY = Math.min(from.bottom, to.bottom) - Math.max(from.top, to.top) > 0;
		const stacked = alongX && (near(to.top, from.bottom) || near(to.bottom, from.top));
		const beside = alongY && (near(to.left, from.right) || near(to.right, from.left));
		if (stacked) {
			if (near(to.left, from.left)) relations.push({ from, to, kind: 'alignLeft' });
			if (near(to.right, from.right)) relations.push({ from, to, kind: 'alignRight' });
			relations.push({ from, to, kind: near(to.top, from.bottom) ? 'below' : 'above' });
		}
		if (beside) {
			if (near(to.top, from.top)) relations.push({ from, to, kind: 'alignTop' });
			if (near(to.bottom, from.bottom)) relations.push({ from, to, kind: 'alignBottom' });
			relations.push({ from, to, kind: near(to.left, from.right) ? 'right' : 'left' });
		}
	}));
	return relations;
}

document.addEventListener('pointerdown', (e) => {
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
	if (handle) {
		// a shared whole edge is a seam and moves as one, which is ahead of both
		// the single widget's pull and the group's scale: it is an inside edge,
		// and those two are what an outside edge means
		const dir = handle.dataset.dir;
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
	} else dragPopout(block, e);
});

// The covering widget's frame is dealt with by `covered` above, which is the
// case that matters. This is the rest of it: a widget nothing lies over is
// never covered, so its frame does take the press, and the page hears of it
// only as its own window handing the focus to the frame. Raising it then keeps
// the order honest for when something is later dragged over it. It catches the
// move in from the page alone — the focus going from one frame straight to
// another raises no event here at all, the window having none left to lose —
// which is why the covered case cannot be built on this
function raiseFocusedFrame() {
	const frame = document.activeElement;
	if (!frame || frame.tagName !== 'IFRAME') return;
	const block = frame.closest('.map-block.popout');
	// as above: a widget hosting a fullscreen map is kept under the others
	if (block && !block.classList.contains('fs-host')) raisePopout(block);
}

// on a tick, the frame holding the focus only after the event. A blur that
// went anywhere else — another tab, another window — leaves activeElement
// something other than a frame, and raises nothing
window.addEventListener('blur', () => setTimeout(raiseFocusedFrame));

// ---------- the keyboard ----------

// Keys for what the buttons cannot do in one gesture, and for backing out of
// what covers the screen. The letters name the thing and not the word for it,
// so they stand whatever language the page comes to speak: R is the [R] the bar
// already carries, G the grid and S its snap. (K, which opens the dialog, lives
// in maps.js with the dialog's own Escape, and is the Croatian Karte.) The three
// are also the tab's glyph cluster, which is where they can be read off:
// [R] [G] [S], each titled with its key. None of this reaches the page while an
// iframe holds the focus — a press inside a frame belongs to the frame's
// document, and these maps are another origin — so a click on the page or on a
// title bar comes first, as it does for the pointer (see updateCovered). The
// dialog's guard is repeated here: not from a text field, whose own Escape is a
// way out of the field, and not under a modifier, which belongs to the browser
const NUDGE_KEYS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

document.addEventListener('keydown', (e) => {
	if (e.altKey || e.ctrlKey || e.metaKey) return;
	if (e.target.matches && e.target.matches('input:not([type="radio"]):not([type="checkbox"]), textarea, [contenteditable]')) return;
	// a fullscreen map is a class and not the browser's own fullscreen, so
	// nothing takes Escape off it; wherever there is a keyboard, this does
	if (e.key === 'Escape') { escapeFullscreen(); return; }
	if (!POPOUT_MQ.matches) return; // the rest act on widgets, which are a desktop thing
	if (e.key === 'r' || e.key === 'R') { e.preventDefault(); reloadAllMaps(); return; }
	if (e.key === 'g' || e.key === 'G') { e.preventDefault(); toggleGridShown(); return; }
	if (e.key === 's' || e.key === 'S') { e.preventDefault(); toggleGridSnapped(); return; }
	// these two stand down under a dialog, as the arrows do below: a board
	// rearranged or a copy made there would be done out of sight
	if (e.key === 'a' || e.key === 'A') { e.preventDefault(); if (!mapSettingsOpen()) arrangeBoard(); return; }
	if (e.key === 'd' || e.key === 'D') { e.preventDefault(); if (!mapSettingsOpen()) duplicateMap(topPopout()); return; }
	// the arrows belong to whatever is on top. While the dialog is open that is
	// the dialog: its body is the only thing that scrolls there, and a widget
	// behind it is not what an arrow pressed on the map list is aimed at. The
	// grid keys above are another matter — those two switches are the dialog's
	// own as well, and it is re-read when they change (setGridPrefs)
	const nudge = NUDGE_KEYS[e.key];
	if (!nudge || mapSettingsOpen()) return;
	e.preventDefault(); // the page would scroll under it
	const step = e.shiftKey ? 1 : GRID_CELL;
	nudgePopout(nudge[0] * step, nudge[1] * step);
});

// a dialog is over everything, so the keys it owns are its own while it is
// there — Escape, and the arrows its body scrolls by. Either of them counts:
// the manual covers the widgets as the picker does
function mapSettingsOpen() {
	return [...document.querySelectorAll('.map-settings')].some(panel => !panel.hidden);
}

// the dialog owns Escape while it is open; under it Escape ends a fullscreen
// map, and under that it does nothing — backing out is not a reason to take
// an arrangement apart
function escapeFullscreen() {
	if (mapSettingsOpen()) return;
	const fs = document.querySelector('.if1.fullscreen');
	if (fs) exitFullscreen(fs);
}

// every map with something to re-fetch, popped out or still in the page: the
// images, the slideshows, the videos and the basic frames. An interactive map
// is left out — its feed is live of its own accord, and navigating its frame
// again would cost it its pan and its zoom for nothing — which is the same
// rule that decides whether a title bar gets an [R] at all, read off the
// content here rather than off the button, since a docked map carries none
function reloadableBlocks() {
	return [...document.querySelectorAll('.map-block')]
		.filter(block => block.querySelector('img[src], video, .if2 iframe[src]'));
}

function reloadAllMaps() {
	reloadableBlocks().forEach(reloadMap);
	restartRefresh(); // the interval runs from the last time the maps were actually new
}

// ---------- auto-refresh (this browser's) ----------

// Images go stale on a page left open, and on a board left running for the
// room to glance at they are the whole point. This re-fetches what [R] does,
// on an interval — off until it is asked for, and a way of working rather than
// part of the view, so it travels in neither a preset nor a link and keeps the
// same footing as the grid switches.
const REFRESH_KEY = 'mapRefresh';
const REFRESH_CHOICES = [5, 10, 15, 30, 60];
const REFRESH_DEFAULT = 5;

function loadRefreshPrefs() {
	try {
		const stored = JSON.parse(localStorage.getItem(REFRESH_KEY));
		if (stored && typeof stored === 'object') return {
			on: stored.on === true,
			minutes: REFRESH_CHOICES.includes(stored.minutes) ? stored.minutes : REFRESH_DEFAULT
		};
	} catch (e) { /* unreadable is off */ }
	return { on: false, minutes: REFRESH_DEFAULT };
}

let { on: refreshOn, minutes: refreshMinutes } = loadRefreshPrefs();
let refreshDeadline = 0;
let refreshTicker = 0;

function isRefreshOn() {
	return refreshOn;
}

function refreshEveryMinutes() {
	return refreshMinutes;
}

// m:ss of what is left, which is what both labels read
function refreshLabel() {
	if (!refreshOn || !refreshDeadline) return '';
	const left = Math.max(0, Math.ceil((refreshDeadline - Date.now()) / 1000));
	return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}

// counted off a deadline rather than by stepping a number down: a background
// tab throttles its timers to about one a minute, and a counter stepped down
// would lose exactly the time the page spent unattended — which is the page
// this is for. The clock starts over here, so every way of refreshing by hand
// (the key, the tab's [R], a widget's own) puts the interval back to full
function restartRefresh() {
	clearInterval(refreshTicker);
	refreshTicker = 0;
	refreshDeadline = refreshOn ? Date.now() + refreshMinutes * 60000 : 0;
	if (refreshOn) refreshTicker = setInterval(refreshTick, 1000);
	syncRefreshLabels();
}

function refreshTick() {
	if (!refreshOn) return;
	if (Date.now() >= refreshDeadline) reloadAllMaps(); // which sets the clock going again
	else syncRefreshLabels();
}

function setRefreshPrefs(on, minutes) {
	dlog(`setRefreshPrefs: on=${on} minutes=${minutes}`);
	refreshOn = on === true;
	refreshMinutes = REFRESH_CHOICES.includes(minutes) ? minutes : REFRESH_DEFAULT;
	try {
		localStorage.setItem(REFRESH_KEY, JSON.stringify({ on: refreshOn, minutes: refreshMinutes }));
	} catch (e) { /* storage disabled or full — the clock still runs this session */ }
	// the countdown hangs off the body, since the tab shows for it off the board
	document.body.classList.toggle('refresh-on', refreshOn);
	restartRefresh();
	const panel = document.getElementById('mapSettings');
	if (panel && !panel.hidden && panel._onRefreshChange) panel._onRefreshChange();
	applyStoredMsTab(); // the countdown coming or going changes how narrow the tab may be
}

function initRefresh() {
	document.body.classList.toggle('refresh-on', refreshOn);
	restartRefresh();
}

// on DOMContentLoaded in both cases, unlike the inits elsewhere that run at
// once when the DOM is already parsed: this one reaches into maps.js for the
// labels and into this file's own later declarations, and in dev — where the
// scripts are deferred rather than inlined, so the DOM is ready as this file
// is read — running it here would be ahead of both, and the throw would take
// the rest of this file down with it
if (document.readyState === 'complete') initRefresh();
else document.addEventListener('DOMContentLoaded', initRefresh);

// the grid is the board's: off it the dialog's own switches are greyed and
// unclickable, the tab's are not shown at all, and the keys are as quiet — a
// switch flipped where nothing shows it is a switch lost
function toggleGridShown() {
	if (!isDashboard()) return;
	setGridPrefs(!isGridShown(), isGridSnapped());
}

function toggleGridSnapped() {
	if (!isDashboard()) return;
	setGridPrefs(isGridShown(), !isGridSnapped());
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

// ---------- the title bar's other gestures ----------

// A widget is a window, and its title bar is where a window is worked from.
// Beside the drag it already is: a double-click on it puts the map in
// fullscreen and takes it out again, and a middle click is the bar's own
// [=]/[x] without having to aim at two characters. Both are on the bar alone,
// never on the map — over a frame the page would never see them, and on an
// interactive map a double-click is already the site's own gesture (the
// overlay gate, main.js: "Dvostruki klik za pristup interaktivnoj karti") and
// then the map's own zoom. A link or a button on the bar is itself, as it is
// for the drag: the title is an <a> to the source, and a middle click on it
// belongs to the browser
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

// the middle button raises the autoscroll cursor on press: the press is taken
// here and the action left to auxclick, which is the click the middle button
// makes
document.addEventListener('mousedown', (e) => {
	if (e.button === 1 && POPOUT_MQ.matches && titleBarOf(e)) e.preventDefault();
});

document.addEventListener('auxclick', (e) => {
	if (e.button !== 1 || !POPOUT_MQ.matches) return;
	const bar = titleBarOf(e);
	if (!bar) return;
	e.preventDefault();
	togglePopout(bar.closest('.map-block')); // docks on the page, takes the map off the board
});

// widgets are a desktop thing: shrinking below the breakpoint puts them back,
// and widening brings back what was put away — the arrangement belongs to the
// view, not to the window, so it waits out a narrow one rather than being
// unmade by it
POPOUT_MQ.addEventListener('change', (e) => {
	if (e.matches) { applySnapLayout(unappliedSnapLayout); return; }
	// what the view stores rather than what is on screen: the viewport has
	// narrowed already, and the fractions read off the screen now would be of
	// the narrow width (B1). Every gesture writes the arrangement as it ends,
	// so the stored one is the one on screen
	unappliedSnapLayout = sanitizeSnapLayout(getActiveMapPrefs().layout, resolveMapIds());
	withPersistPaused(dockAllPopouts); // the stored arrangement is kept for a desktop window
});

// a smaller window must not strand a widget off-screen
window.addEventListener('resize', () => {
	clearTimeout(window._popoutResizeTimeout);
	window._popoutResizeTimeout = setTimeout(() => {
		layoutSnapColumns();
		// a group is kept whole: moved by its box, not member by member
		const done = new Set();
		floatingBlocks().forEach(block => {
			if (done.has(block)) return;
			const members = groupMembers(block);
			members.forEach(m => done.add(m));
			if (members.length === 1) {
				const rect = block.getBoundingClientRect();
				placePopout(block, rect.left, rect.top);
			} else {
				const starts = groupStarts(members);
				moveGroup(starts, groupBox(starts), 0, 0);
			}
		});
		updateGroups();
		updateCovered(); // the clamp may have moved a widget onto or off another
	}, 200);
});

// ---------- snap columns (desktop) ----------

// a widget dragged to the left or right edge of the viewport snaps into a
// column there: a strip of the viewport's height in which panes sit freely one
// above another, the page laid out in what is left between the columns (body
// padding, through --snap-l/--snap-r). A pane is still a pop-out widget — same
// block, same fixed positioning, nothing moves in the DOM — only its width is
// the column's and its place comes from layoutSnapColumns(): a column has a
// width and each pane a top (a free pane a height too), all fractions of the
// viewport so a window resize keeps the proportions. Up and down the column a
// pane moves as a widget does over the page, the column's ends and the other
// panes its magnets; pulled sideways it floats again. The column's inner edge is
// its resize handle (.snap-ui, above the panes); .snap-col paints the column's
// ground below them. A free (iframe) pane keeps its own height; a locked one
// takes the column's width whole and the height its aspect gives at it. Either
// resizes by its top and bottom edge, a pull on a locked one letting the aspect
// go, since at a width that is not the pane's to give that is the only way a
// height changes. A group is a stack, kept one under another by every layout
// (settleSnapStacks). A fullscreen map in a pane fills what the column leaves
// free around it (fitSnapFullscreen).
//
// The columns can take the whole width — two of them meeting, or one at full
// width — which hides the page (body.snap-full also drops its scrollbar). An
// edge dragged that close snaps shut; a double-click on an edge shuts it too, or
// opens it back to the widths from before. Two columns that meet share one seam
// handle that moves width between them.
const SNAP_EDGE = 5; // a widget edge this close to a viewport edge targets its column
const SNAP_SHUT = 24; // a column edge this close to the far side shuts the page
const SNAP_DETACH = 40; // sideways drag distance before a snapped pane floats again
const SNAP_ARM = 4; // drag distance before a floating widget can snap (a click on a parked widget must not)
const SNAP_MIN_WIDTH = POPOUT_MIN_WIDTH;
const snapColumns = {
	left: { side: 'left', width: null, panes: [], node: null, ui: null },
	right: { side: 'right', width: null, panes: [], node: null, ui: null }
};
let snapPreview = null;
let snapPageWidths = null; // the column widths before the page was hidden, for the way back

function isSnapped(block) {
	return block.classList.contains('snapped');
}

function snapColumnOf(block) {
	return Object.values(snapColumns).find(col => col.panes.some(p => p.block === block)) || null;
}

function snapPaneOf(block) {
	const col = snapColumnOf(block);
	return col ? col.panes.find(p => p.block === block) : null;
}

function otherSnapColumn(col) {
	return col.side === 'left' ? snapColumns.right : snapColumns.left;
}

function snapColumnWidth(col) {
	return col.panes.length ? col.width : 0;
}

function snapColumnPx(col) {
	return Math.round(snapColumnWidth(col) * viewportWidth());
}

// the columns leave the page no width (a rounding hair short of it counts)
function isSnapPageHidden() {
	return snapColumnWidth(snapColumns.left) + snapColumnWidth(snapColumns.right) >= 0.999;
}

// the column something spanning left..right is at: the one whose viewport
// edge its own edge has reached, if any. The board has no columns — a column
// is a strip the page makes room for, and there is no page there — so on it
// nothing targets one and a widget dragged to the edge simply stays a widget
function snapSideAt(left, right) {
	if (isDashboard()) return null;
	return left <= SNAP_EDGE ? 'left' : right >= viewportWidth() - SNAP_EDGE ? 'right' : null;
}

// the edges a pane's top or bottom is drawn to in its column: the column's
// ends and the other panes' tops and bottoms (every pane spans the column, so
// all of them are in reach), the blocks given left out
function paneMagnetEdges(col, exclude = []) {
	const edges = [0, viewportHeight()];
	col.panes.forEach(p => {
		if (exclude.includes(p.block) || p.block.classList.contains('fs-host')) return;
		const rect = p.block.getBoundingClientRect();
		edges.push(rect.top, rect.bottom);
	});
	return edges;
}

// a top for something of this height in the column: pulled onto an edge by
// its top or its bottom, then held inside the viewport
function paneTop(col, top, height, exclude = []) {
	const edges = paneMagnetEdges(col, exclude);
	const pulled = magnetEdge(top, edges.concat(edges.map(edge => edge - height)));
	return clamp(pulled === null ? top : pulled, 0, Math.max(0, viewportHeight() - height));
}

// the slot blocks dropped at side would take, the top their box asks for:
// the column's width (a new column takes the box's own, held to what the
// other column leaves) and the height the blocks stack to at that width — a
// free one keeps its height, a locked one's follows the width
function snapSlot(blocks, side, boxTop) {
	const col = snapColumns[side];
	const boxWidth = Math.max(...blocks.map(b => b.offsetWidth));
	const width = col.panes.length
		? snapColumnPx(col)
		: clamp(boxWidth, SNAP_MIN_WIDTH, viewportWidth() - snapColumnPx(otherSnapColumn(col)));
	const height = blocks.reduce((sum, b) =>
		sum + (b.classList.contains('free') ? b.offsetHeight : Math.round(b.offsetHeight * width / b.offsetWidth)), 0);
	return {
		left: side === 'left' ? 0 : viewportWidth() - width,
		top: Math.round(paneTop(col, boxTop, height, blocks)),
		width,
		height
	};
}

function showSnapPreview(rect) {
	if (!snapPreview) {
		snapPreview = el('div', { class: 'snap-preview', hidden: true });
		document.body.appendChild(snapPreview);
	}
	snapPreview.hidden = !rect;
	if (!rect) return;
	Object.assign(snapPreview.style, {
		left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`
	});
}

// blocks dropped into the column at side, stacked from the slot's top in
// their order: the first where the slot says, each next under the one before
function snapPanes(blocks, side, slot) {
	const col = snapColumns[side];
	if (!col.panes.length) col.width = slot.width / viewportWidth();
	let y = slot.top;
	blocks.forEach(block => {
		dlog(`snapPane: ${block.dataset.mapId} → ${side}`);
		unsnapPane(block);
		attachSnapPane(col, block, y / viewportHeight());
		layoutSnapColumns();
		y = block.getBoundingClientRect().bottom;
	});
	persistSnapLayout();
}

// a popped-out block becomes a pane of the column with its top there (a free
// one bringing its height along, the one it has unless stored); the first
// one brings the column's ground and handle with it
function attachSnapPane(col, block, top, height) {
	if (!col.node) {
		col.node = el('div', { class: `snap-col snap-${col.side}` });
		col.ui = el('div', { class: `snap-ui snap-${col.side}` }, [
			el('div', { class: 'snap-edge', 'data-side': col.side })
		]);
		document.body.append(col.node, col.ui);
	}
	const pane = { block, top };
	if (block.classList.contains('free')) pane.height = height || block.offsetHeight / viewportHeight();
	col.panes.push(pane);
	block.classList.add('snapped', `snapped-${col.side}`); // the side places the pane's fullscreen (CSS)
}

// the pane floats again as it stood in the column, size and place kept
function unsnapPane(block) {
	const col = snapColumnOf(block);
	if (!col) return;
	dlog(`unsnapPane: ${block.dataset.mapId}`);
	col.panes = col.panes.filter(p => p.block !== block);
	block.classList.remove('snapped', `snapped-${col.side}`);
	if (!col.panes.length) dropSnapColumn(col);
	layoutSnapColumns();
	// not persisted here: the callers (a drag, a dock, a move between columns) end in a state of their own
}

function dropSnapColumn(col) {
	if (col.node) col.node.remove();
	if (col.ui) col.ui.remove();
	col.node = col.ui = col.width = null;
	col.panes = [];
}

// the panes are gone with the tbody they were part of, and the board with
// them (applySnapLayout sets it again from the layout)
function resetSnapColumns() {
	Object.values(snapColumns).forEach(dropSnapColumn);
	snapPageWidths = null;
	setDashboard(false);
	layoutSnapColumns();
}

function layoutSnapColumns() {
	// first: with the page hidden its scrollbar goes, which widens the viewport the columns are laid out in
	document.body.classList.toggle('snap-full', isSnapPageHidden());
	const root = document.documentElement.style;
	root.setProperty('--snap-l', `${snapColumnPx(snapColumns.left)}px`);
	root.setProperty('--snap-r', `${snapColumnPx(snapColumns.right)}px`);
	const seam = isSnapPageHidden() && snapColumns.left.panes.length && snapColumns.right.panes.length;
	Object.values(snapColumns).forEach(col => {
		layoutSnapColumn(col, seam);
		col.panes.forEach(p => fitWidget(p.block)); // the column's width is theirs
	});
}

// with two columns meeting, the left edge handle is the seam between them and
// the right one steps aside
function layoutSnapColumn(col, seam) {
	const width = snapColumnPx(col);
	if (!width) return;
	const x = col.side === 'left' ? 0 : viewportWidth() - width;
	[col.node, col.ui].forEach(node => {
		node.style.left = `${x}px`;
		node.style.width = `${width}px`;
	});
	const edge = col.ui.querySelector('.snap-edge');
	edge.hidden = seam && col.side === 'right';
	edge.classList.toggle('snap-seam', seam && col.side === 'left');
	edge.title = seam ? 'Širina stupaca · dvoklik vraća stranicu'
		: isSnapPageHidden() ? 'Širina stupca · dvoklik vraća stranicu'
		: 'Širina stupca · dvoklik sakriva stranicu';
	col.panes.forEach(pane => fitSnapPane(pane, x, width));
	settleSnapStacks(col);
	fitSnapFullscreen(col);
}

// a group in a column is a stack: the members sit one under another in the
// order of their tops, from where the first one stands, whatever the fit
// made of their heights (a locked pane's follows the column's width), and
// the stack is held inside the viewport by its bottom — else by its top —
// the tops the members carry following
function settleSnapStacks(col) {
	const stacks = new Map();
	col.panes.forEach(p => {
		if (!p.block._group) return;
		if (!stacks.has(p.block._group)) stacks.set(p.block._group, []);
		stacks.get(p.block._group).push(p);
	});
	stacks.forEach(panes => {
		panes.sort((a, b) => a.top - b.top);
		const height = panes.reduce((sum, p) => sum + p.block.offsetHeight, 0);
		let y = clamp(panes[0].block.getBoundingClientRect().top, 0, Math.max(0, viewportHeight() - height));
		panes.forEach(p => {
			p.block.style.top = `${Math.round(y)}px`;
			p.top = y / viewportHeight();
			y += p.block.offsetHeight;
		});
	});
}

// a fullscreen map in a pane fills what its column leaves free around the
// pane: from the bottom of the panes above it (their top over the pane's —
// one lying over it counts, since it stays on top) to the top of the panes
// below it, the column's ends where there are none, and at least a map's
// minimum height whatever lies over it — the CSS reads the span off
// --fs-top and --fs-bottom, the other panes' rects as laid out just now
function fitSnapFullscreen(col) {
	col.panes.forEach(pane => {
		const block = pane.block;
		if (!block.classList.contains('fs-host')) {
			block.style.removeProperty('--fs-top');
			block.style.removeProperty('--fs-bottom');
			return;
		}
		const rect = block.getBoundingClientRect();
		let top = 0, bottom = viewportHeight();
		col.panes.forEach(p => {
			if (p === pane || p.block.classList.contains('fs-host')) return;
			const other = p.block.getBoundingClientRect();
			if (other.top < rect.top) top = Math.max(top, other.bottom);
			else bottom = Math.min(bottom, other.top);
		});
		const min = POPOUT_TITLE_HEIGHT + POPOUT_MIN_HEIGHT;
		top = clamp(top, 0, viewportHeight() - min);
		bottom = Math.max(bottom, top + min);
		block.style.setProperty('--fs-top', `${Math.round(top)}px`);
		block.style.setProperty('--fs-bottom', `${Math.round(viewportHeight() - bottom)}px`);
	});
}

// The board's answer to the same question. A column gives a pane one axis to
// grow in — the strip is the width, the panes above and below are the ends —
// and the board gives a widget four sides: the map takes the whole viewport,
// and a side comes in only where another widget *walls it off*, that is where
// the widgets on that side together cover the rectangle from end to end of its
// other axis. A widget that does not reach across walls nothing off and is
// floated over; the widgets keep their z-index range above the fullscreen map,
// so one in a corner stays where it is, over the corner of a map of the whole
// board. A widget lying over the host is on no side of it and so is never a
// wall.
//
// The walls are looked for again once the sides have come in, since narrowing
// the rectangle is what lets a widget reach across it: a widget over the right
// half alone walls off nothing of the viewport, and walls off the top of a
// rectangle that is already the right half. It settles in a pass or two —
// every pass only narrows — and stops when nothing moves.
function freeRectAround(rect, blockers, bounds) {
	// the spans, laid end to end, reach from one side of the rectangle to the
	// other. A gap no wider than POPOUT_MARGIN is no gap: it is the grid's cell,
	// so widgets stacked on the grid wall as the eye reads them, and it is the
	// slack a wall wants anyway — a widget a few pixels off one still shuts the
	// region behind it as far as the eye is concerned.
	const covers = (spans, from, to) => {
		let at = from;
		spans.sort((a, b) => a[0] - b[0]).forEach(([lo, hi]) => {
			if (lo <= at + POPOUT_MARGIN) at = Math.max(at, hi);
		});
		return at >= to - POPOUT_MARGIN;
	};
	// the nearest line to the host's left that the widgets beyond it cover from
	// `from` to `to`; the other three sides are this one under a mirror or a
	// transpose, so there is one of these and not four
	const leftWall = (host, walls, from, to, fallback) => {
		const beyond = walls.filter(b => b.right <= host.left + 1);
		const lines = [...new Set(beyond.map(b => b.right))].sort((a, b) => b - a); // nearest first
		for (const line of lines) {
			const across = beyond.filter(b => b.left < line - 0.5 && b.right >= line - 0.5);
			if (covers(across.map(b => [b.top, b.bottom]), from, to)) return line;
		}
		return fallback;
	};
	const mirror = (r) => ({ left: -r.right, right: -r.left, top: r.top, bottom: r.bottom });
	const flip = (r) => ({ left: r.top, right: r.bottom, top: r.left, bottom: r.right });
	const both = (r) => mirror(flip(r));
	const mirrored = blockers.map(mirror), flipped = blockers.map(flip), bothed = blockers.map(both);
	let out = { ...bounds };
	for (let pass = 0; pass < 4; pass++) {
		const next = {
			left: leftWall(rect, blockers, out.top, out.bottom, bounds.left),
			right: -leftWall(mirror(rect), mirrored, out.top, out.bottom, -bounds.right),
			top: leftWall(flip(rect), flipped, out.left, out.right, bounds.top),
			bottom: -leftWall(both(rect), bothed, out.left, out.right, -bounds.bottom)
		};
		if (next.left === out.left && next.right === out.right && next.top === out.top && next.bottom === out.bottom) break;
		out = next;
	}
	return out;
}

function fitBoardFullscreen() {
	const props = ['--fs-left', '--fs-right', '--fs-top', '--fs-bottom'];
	const blocks = floatingBlocks();
	const board = isDashboard();
	blocks.forEach(block => {
		if (!board || !block.classList.contains('fs-host')) {
			props.forEach(p => block.style.removeProperty(p));
			return;
		}
		const width = viewportWidth(), height = viewportHeight();
		// the widget's box is still there to read under its own fullscreen: the
		// bar and the map have gone position: fixed, but every map with a [ ] is
		// an interactive one, and an interactive map's widget is always free
		// (isFreePopout) and so carries an inline height of its own
		const rect = block.getBoundingClientRect();
		const blockers = blocks
			.filter(b => b !== block && !b.classList.contains('fs-host'))
			.map(b => b.getBoundingClientRect());
		const free = freeRectAround(
			{ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
			blockers, { left: 0, top: 0, right: width, bottom: height });
		block.style.setProperty('--fs-left', `${Math.round(free.left)}px`);
		block.style.setProperty('--fs-right', `${Math.round(width - free.right)}px`);
		block.style.setProperty('--fs-top', `${Math.round(free.top)}px`);
		block.style.setProperty('--fs-bottom', `${Math.round(height - free.bottom)}px`);
	});
}

// a pane takes the column's width — a free one with the height it carries, a
// locked one with the height its aspect gives at that width, the map following
// the column however wide it is pulled. Its top is the one it carries, held
// inside the viewport
function fitSnapPane(pane, x, width) {
	const block = pane.block;
	block.style.width = `${width}px`;
	if (pane.height !== undefined) {
		block.style.height = `${Math.round(clamp(pane.height * viewportHeight(), POPOUT_MIN_HEIGHT, viewportHeight()))}px`;
	}
	block.style.left = `${Math.round(x + (width - block.offsetWidth) / 2)}px`;
	block.style.top = `${Math.round(clamp(pane.top * viewportHeight(), 0, Math.max(0, viewportHeight() - block.offsetHeight)))}px`;
}

// panes moved up or down their column by one offset from where they stood
// (starts, their box): the box is drawn to the column's magnets and held
// inside the viewport, and the tops the panes carry follow
function movePanes(col, starts, box, dy) {
	const top = paneTop(col, box.top + dy, box.height, starts.map(s => s.block));
	dy = top - box.top;
	starts.forEach(s => { snapPaneOf(s.block).top = (s.top + dy) / viewportHeight(); });
	layoutSnapColumns();
}

// the inner edge: the column may take everything the other one leaves, and
// close to that it snaps shut, hiding the page (the widths from before are
// kept for the double-click back)
function resizeSnapColumn(col, e) {
	const start = snapColumnPx(col);
	const max = viewportWidth() - snapColumnPx(otherSnapColumn(col));
	const before = { left: snapColumnWidth(snapColumns.left), right: snapColumnWidth(snapColumns.right) };
	trackPopoutPointer(e, (dx) => {
		let px = clamp(col.side === 'left' ? start + dx : start - dx, SNAP_MIN_WIDTH, max);
		if (px >= max - SNAP_SHUT) px = max;
		const width = px / viewportWidth();
		// exactly what the other leaves: the fractions have to sum to one for the hidden state to read
		col.width = px === max ? 1 - snapColumnWidth(otherSnapColumn(col)) : width;
		if (isSnapPageHidden() && !snapPageWidths && before.left + before.right < 0.999) snapPageWidths = before;
		if (!isSnapPageHidden()) snapPageWidths = null;
		layoutSnapColumns();
	}, persistSnapLayout);
}

// the seam between two columns that meet moves width from one to the other
function resizeSnapSeam(e) {
	const { left, right } = snapColumns;
	const start = snapColumnPx(left);
	trackPopoutPointer(e, (dx) => {
		const px = clamp(start + dx, SNAP_MIN_WIDTH, viewportWidth() - SNAP_MIN_WIDTH);
		left.width = px / viewportWidth();
		right.width = 1 - left.width;
		layoutSnapColumns();
	}, persistSnapLayout);
}

// double-click on an edge: hide the page behind the columns — this column
// takes what the other leaves — or bring it back, to the widths from before
// the page was hidden, else with a gap wide enough for the page's table
function toggleSnapPage(col) {
	const other = otherSnapColumn(col);
	if (!isSnapPageHidden()) {
		snapPageWidths = { left: snapColumnWidth(snapColumns.left), right: snapColumnWidth(snapColumns.right) };
		col.width = 1 - snapColumnWidth(other);
	} else if (snapPageWidths && snapPageWidths.left + snapPageWidths.right < 0.999) {
		[snapColumns.left, snapColumns.right].forEach(c => { if (c.panes.length && snapPageWidths[c.side]) c.width = snapPageWidths[c.side]; });
		snapPageWidths = null;
	} else {
		const gap = Math.min(0.5, POPOUT_MAX_WIDTH / viewportWidth());
		[snapColumns.left, snapColumns.right].forEach(c => { if (c.panes.length) c.width *= 1 - gap; });
		snapPageWidths = null;
	}
	layoutSnapColumns();
	persistSnapLayout();
}

function snapHandlePointerDown(handle, e) {
	if (handle.classList.contains('snap-seam')) resizeSnapSeam(e);
	else resizeSnapColumn(snapColumns[handle.dataset.side], e);
}

// the drag's preventDefault on pointerdown leaves click and dblclick alone,
// and the browser already tells a double-click from two drags apart
document.addEventListener('dblclick', (e) => {
	if (!e.target.closest) return;
	const edge = e.target.closest('.snap-edge');
	if (edge) toggleSnapPage(snapColumns[edge.dataset.side]);
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
		persistSnapLayout();
	}
});

// ---------- snap layout: remembered and shared ----------

// the arrangement as data: per side the column width and the panes as map
// ids with their tops (and a free pane's height), every number a fraction of
// the viewport, so another window or screen gets the proportions. Null when
// nothing is snapped. It rides in mapPrefs next to the map list, in a saved
// preset next to its maps, and in the ?v= payload — always a subset of the
// map list it sits beside, which is what sanitizeSnapLayout() holds it to on
// the way back. A group is a number shared by its members' entries, counted
// in order of appearance across the columns and the floating widgets
// the key each showing is stored under. Which showing is which is only a
// matter of the moment — any can be closed and another take the page's place —
// so the keys are dealt afresh on every write: the page's own showing first,
// under the plain map id, which is the block the render gives back on load, and
// the rest #2, #3 on in the page's order. A layout thus never names a copy of a
// map without the map itself, whichever of its showings were left
function layoutKeys() {
	const keys = new Map(), counts = new Map();
	const blocks = [...document.querySelectorAll('.map-block')];
	[...blocks.filter(b => !isDuplicate(b)), ...blocks.filter(isDuplicate)].forEach(block => {
		const id = block.dataset.mapId;
		const index = (counts.get(id) || 0) + 1;
		counts.set(id, index);
		keys.set(block, instKey(id, index));
	});
	return keys;
}

function snapLayout() {
	const layout = {};
	const keys = layoutKeys();
	const groupNumbers = new Map();
	const groupNumber = (block) => {
		if (!block._group) return undefined;
		if (!groupNumbers.has(block._group)) groupNumbers.set(block._group, groupNumbers.size + 1);
		return groupNumbers.get(block._group);
	};
	Object.values(snapColumns).forEach(col => {
		if (!col.panes.length) return;
		layout[col.side] = {
			width: roundFraction(col.width),
			panes: [...col.panes].sort((a, b) => a.top - b.top).map(p => {
				const entry = { id: keys.get(p.block), top: roundFraction(p.top) };
				if (p.height !== undefined) entry.height = roundFraction(p.height);
				const group = groupNumber(p.block);
				if (group) entry.group = group;
				if (p.block.classList.contains('fs-host')) entry.fullscreen = true;
				return entry;
			})
		};
	});
	// widgets floating over the page, bottom to top, so they stack the same
	// way again; a locked one has no height of its own to store
	const floating = floatingBlocks()
		.sort((a, b) => (Number(a.style.zIndex) || 0) - (Number(b.style.zIndex) || 0))
		.map(block => {
			const rect = block.getBoundingClientRect();
			const entry = {
				id: keys.get(block),
				left: roundFraction(rect.left / viewportWidth()),
				top: roundFraction(rect.top / viewportHeight()),
				width: roundFraction(rect.width / viewportWidth())
			};
			if (block.classList.contains('free')) entry.height = roundFraction(rect.height / viewportHeight());
			const group = groupNumber(block);
			if (group) entry.group = group;
			if (block.classList.contains('fs-host')) entry.fullscreen = true;
			return entry;
		});
	if (floating.length) layout.floating = floating;
	if (dashboardMode) layout.dashboard = true;
	return Object.keys(layout).length ? layout : null;
}

// only an interactive map has a fullscreen to be stored
function hasFullscreen(inst) {
	const map = catalogMap(instMapId(inst));
	return !!map && map.type === 'iframe';
}

// a map put fullscreen as stored: through its own button, so main.js does
// everything a click does (the gate, the [R], the scroll lock, the event)
function restoreFullscreen(block) {
	const btn = block.querySelector('.fs-btn');
	if (btn && !block.querySelector('.if1.fullscreen')) btn.click();
}

function roundFraction(n) {
	return Math.round(n * 10000) / 10000;
}

// rebuilt rather than trusted (storage, links, a saved entry): a pane must
// name a map in the list, once across both columns and the floating widgets,
// and carry a top (a layout from before panes were placed freely carries a
// height share instead: those are stacked from the top as they were); the
// two widths are held to the viewport. A map dropped from the list leaves
// the layout, and an emptied column with it. A group is its members' place
// as much as their number: fewer than two, or spread over two places, is no
// group
function sanitizeSnapLayout(layout, mapIds) {
	if (!layout || typeof layout !== 'object') return null;
	const clean = {};
	const seen = new Set();
	const fraction = (n, max = 1) => Number.isFinite(n) && n >= 0 && n <= max;
	const groupOf = (entry) => Number.isInteger(entry.group) && entry.group > 0 ? entry.group : undefined;
	const board = layout.dashboard === true;
	['left', 'right'].forEach(side => {
		if (board) return; // a board has no columns: its panes are dropped here and come back as widgets, through popoutRest
		const col = layout[side];
		if (!col || typeof col !== 'object' || !Array.isArray(col.panes)) return;
		const width = Number(col.width);
		if (!(width > 0 && width <= 1)) return;
		const panes = [];
		let stacked = 0;
		col.panes.forEach(p => {
			if (!(p && typeof p.id === 'string' && mapIds.includes(instMapId(p.id)) && !seen.has(p.id))) return;
			const entry = { id: p.id };
			const top = Number(p.top), height = Number(p.height), share = Number(p.share);
			if (fraction(top)) {
				entry.top = roundFraction(top);
			} else if (share > 0 && share <= 1) {
				entry.top = roundFraction(stacked);
				entry.height = roundFraction(share);
				stacked += share;
			} else {
				return;
			}
			if (fraction(height) && height > 0) entry.height = roundFraction(height);
			const group = groupOf(p);
			if (group) entry.group = group;
			if (p.fullscreen === true && hasFullscreen(p.id)) entry.fullscreen = true;
			seen.add(p.id);
			panes.push(entry);
		});
		if (!panes.length) return;
		clean[side] = { width: roundFraction(width), panes };
	});
	if (clean.left && clean.right && clean.left.width + clean.right.width > 1) {
		clean.right.width = roundFraction(1 - clean.left.width);
		if (clean.right.width <= 0) delete clean.right;
	}
	if (Array.isArray(layout.floating)) {
		const floating = layout.floating
			.filter(f => f && typeof f.id === 'string' && mapIds.includes(instMapId(f.id)) && !seen.has(f.id)
				&& fraction(Number(f.left)) && fraction(Number(f.top)) && fraction(Number(f.width)) && Number(f.width) > 0)
			.map(f => {
				seen.add(f.id);
				const entry = { id: f.id, left: roundFraction(Number(f.left)), top: roundFraction(Number(f.top)), width: roundFraction(Number(f.width)) };
				if (fraction(Number(f.height)) && Number(f.height) > 0) entry.height = roundFraction(Number(f.height));
				const group = groupOf(f);
				if (group) entry.group = group;
				if (f.fullscreen === true && hasFullscreen(f.id)) entry.fullscreen = true;
				return entry;
			});
		if (floating.length) clean.floating = floating;
	}
	const lists = [clean.left && clean.left.panes, clean.right && clean.right.panes, clean.floating].filter(Boolean);
	const groups = new Map(); // group number → how many members, over how many places
	lists.forEach(list => list.forEach(entry => {
		if (!entry.group) return;
		if (!groups.has(entry.group)) groups.set(entry.group, { count: 0, places: new Set() });
		groups.get(entry.group).count++;
		groups.get(entry.group).places.add(list);
	}));
	lists.forEach(list => list.forEach(entry => {
		const group = groups.get(entry.group);
		if (group && (group.count < 2 || group.places.size > 1)) delete entry.group;
	}));
	if (board) clean.dashboard = true; // a board with nothing placed yet is still a board
	return Object.keys(clean).length ? clean : null;
}

function sameSnapLayout(a, b) {
	return JSON.stringify(a || null) === JSON.stringify(b || null);
}

// the columns from a (sanitized) layout, after a render: each pane is popped
// out and attached to its column as stored, then the widths are set as
// stored. Desktop only, like the gestures — on a phone the layout is carried,
// not shown
function applySnapLayout(layout) {
	resetSnapColumns();
	// the mode before anything is measured: the page's scrollbar goes with it
	setDashboard(!!(layout && layout.dashboard && POPOUT_MQ.matches));
	// nothing to place, but the sweep still has to run: the widgets this replaces
	// go with the tbody (renderMaps) rather than being docked, so their shadows
	// are left in the layer with no widget to own them, and the updateCovered
	// that sweeps them is below this return
	if (!layout || !POPOUT_MQ.matches) {
		// a narrow window is not a change of mind: the arrangement it cannot
		// show is kept whole, to be written on the view's behalf and applied
		// once there is a desktop window again
		unappliedSnapLayout = POPOUT_MQ.matches ? null : layout;
		syncShadows();
		return;
	}
	unappliedSnapLayout = null;
	// what is being applied is already what is stored
	const tiled = withPersistPaused(() => placeSnapLayout(layout));
	// the tiling was decided here rather than read from the layout, so it is
	// the one thing this function has to write back
	if (tiled) persistSnapLayout();
}

// the widgets and panes a layout names, put in place; true when the board had
// nothing placed and was tiled instead
function placeSnapLayout(layout) {
	const toFullscreen = [];
	const groupIds = new Map(); // stored group number → a fresh id
	const setGroup = (block, group) => {
		if (!group) return;
		if (!groupIds.has(group)) groupIds.set(group, `g${++groupSeq}`);
		block._group = groupIds.get(group);
	};
	['left', 'right'].forEach(side => {
		const stored = layout[side];
		if (!stored) return;
		const col = snapColumns[side];
		stored.panes.forEach(({ id, top, height, group, fullscreen }) => {
			const block = instanceFor(id);
			if (!block || block.classList.contains('popout')) return;
			popoutMap(block);
			if (height && !block.classList.contains('free')) unlockAspect(block); // a locked map stored with a height was freed
			attachSnapPane(col, block, top, height);
			setGroup(block, group);
			if (fullscreen) toFullscreen.push(block);
		});
		if (!col.panes.length) return;
		col.width = clamp(stored.width * viewportWidth(), SNAP_MIN_WIDTH, viewportWidth()) / viewportWidth();
	});
	const { left, right } = snapColumns;
	if (left.panes.length && right.panes.length && left.width + right.width > 1) right.width = 1 - left.width;
	layoutSnapColumns();
	(layout.floating || []).forEach(({ id, left, top, width, height, group, fullscreen }) => {
		const block = instanceFor(id);
		if (!block || block.classList.contains('popout')) return;
		popoutMap(block);
		if (height && !block.classList.contains('free')) unlockAspect(block);
		// the stored width as stored, held to the widget limits
		block.style.width = `${Math.round(clamp(width * viewportWidth(), POPOUT_MIN_WIDTH, popoutMaxWidth()))}px`;
		if (block.classList.contains('free') && height)
			block.style.height = `${Math.round(clamp(height * viewportHeight(), POPOUT_MIN_HEIGHT, viewportHeight()))}px`;
		placePopout(block, left * viewportWidth(), top * viewportHeight());
		raisePopout(block); // in stored order, so the last one is on top again
		setGroup(block, group);
		if (fullscreen) toFullscreen.push(block);
	});
	// a board the layout places nothing on is a new one, and a new board is
	// tiled rather than cascaded. Where it does place some, the rest cascade in
	// beside them: an arrangement already made is not taken apart to make room
	const tiled = dashboardMode && !(layout.floating || []).length;
	if (dashboardMode) popoutRest(); // the maps of the list the layout does not place: onto the board
	if (tiled) arrangeBoard();
	// once everything stands where it belongs: a pane's fullscreen is placed
	// by its column, and main.js reads off the pane whether to lock the page
	toFullscreen.forEach(restoreFullscreen);
	updateGroups();
	updateCovered(); // persistence is paused, so this is not reached through it
	return tiled;
}

function applyStoredSnapLayout() {
	applySnapLayout(sanitizeSnapLayout(getActiveMapPrefs().layout, resolveMapIds()));
}

let snapPersistPaused = false;

// fn with the arrangement's writes held back, and whatever was in force
// before put back afterwards — also when fn throws, which would otherwise
// leave every later gesture unsaved for the rest of the session
function withPersistPaused(fn) {
	const paused = snapPersistPaused;
	snapPersistPaused = true;
	try {
		return fn();
	} finally {
		snapPersistPaused = paused;
	}
}

// the arrangement the view holds but the window is too narrow to show. Below
// the breakpoint applySnapLayout() places nothing, so the board stands empty
// while the preferences still describe a desktop arrangement — and snapLayout(),
// which reads the screen, would describe that emptiness. Everything that writes
// the arrangement, or asks the dialog what the view holds, goes through
// currentSnapLayout() instead, so a narrow window never writes the empty board
// over what a desktop window put there. Cleared the moment it is applied
let unappliedSnapLayout = null;

// what is on screen, or — where none of it is placed — what is stored waiting
// for a desktop window
function currentSnapLayout() {
	return unappliedSnapLayout || snapLayout();
}

// the mode the view holds, which below the breakpoint is the stored one: the
// board is not on screen there, but it is still what the view says, and the
// dialog's mode row would otherwise tick itself off and apply that
function isDashboardView() {
	return unappliedSnapLayout ? unappliedSnapLayout.dashboard === true : isDashboard();
}

// the arrangement is written as it changes — it is direct manipulation, not
// a form with an apply button — next to the map list it belongs to: into the
// preferences, or, while a shared view is on, into that view and back into
// the address bar, so the link stays re-copyable with the arrangement as it
// is now and a refresh keeps it (the recipient's storage is still never
// written). Paused while the breakpoint docks everything: that is the window
// changing, not the arrangement
function persistSnapLayout() {
	// every gesture ends here: what touches what, and what lies over what, may
	// both have changed
	updateGroups();
	updateCovered();
	if (snapPersistPaused) return;
	const layout = currentSnapLayout();
	if (sharedMapView) {
		if (layout) sharedMapView.layout = layout;
		else delete sharedMapView.layout;
		const url = new URL(window.location);
		url.searchParams.set('v', encodeMapView(sharedMapView));
		history.replaceState(null, '', url);
	} else {
		const prefs = getMapPrefs();
		if (layout) prefs.layout = layout;
		else delete prefs.layout;
		saveMapPrefs(prefs);
	}
	// the settings panel, if open, names the arrangement and offers Ažuriraj off
	// it. A press outside the dialog is taken by the backdrop and shuts it, so
	// what reaches this with the panel still up is what the panel itself drives:
	// Vrati sve on the layout line
	const panel = document.getElementById('mapSettings');
	if (panel && !panel.hidden && panel._onLayoutChange) panel._onLayoutChange();
}

// a fullscreen map fills its container (CSS off --snap-l/--snap-r and the
// pane's side class); main.js says when one is toggled, so the column can
// hide its dividers under it — and, when the page's scroll lock takes the
// scrollbar, the viewport the columns are laid out in has changed width
document.addEventListener('map-fullscreen', () => {
	// only the bar and the map move to the fullscreen place; the widget's box
	// would stay behind, an empty frame over whatever it was floating on.
	// The widgets floating over the page stay in view over the fullscreen map:
	// the host goes under every other widget for as long as it hosts one (the
	// page's own fullscreen sits there through the CSS), then back on top
	document.querySelectorAll('.map-block.popout').forEach(block => {
		const hosting = !!block.querySelector('.if1.fullscreen');
		const wasHosting = block.classList.contains('fs-host');
		block.classList.toggle('fs-host', hosting);
		if (hosting) block.style.zIndex = POPOUT_FS_Z;
		else if (wasHosting) raisePopout(block);
	});
	fitBoardFullscreen(); // on the board there is no column to fit it, and no page either
	layoutSnapColumns();
	// a widget's fullscreen is part of the arrangement (the fullscreen flag on
	// its entry); on a phone there is no arrangement on screen to write
	if (POPOUT_MQ.matches) persistSnapLayout();
});

// a locked pane's height can change under the fit: a titled slideshow takes
// its width from the image (so the real height is there once it has loaded)
// and changes aspect with the slide (arrows and swipe end in a click or a
// pointerup) — fit again after the change has been applied
// — and the same events bring a slide's title bar on screen, to be fitted
['load', 'click', 'pointerup'].forEach(type => {
	document.addEventListener(type, (e) => {
		const block = e.target.closest && e.target.closest('.map-block.popout');
		if (!block) return;
		setTimeout(() => {
			if (isSnapped(block) && !block.classList.contains('free')) layoutSnapColumns();
			fitWidget(block);
			syncBackdrop(block); // the image on screen may be another
			syncShadows(); // a floating locked widget's height changed with it, and its shadow is its size
		}, 0);
	}, true);
});
