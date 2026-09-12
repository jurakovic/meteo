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
const POPOUT_MARGIN = 16; // kept free of the viewport edge when sizing
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
	else if (dashboardMode) removeFromDashboard(block);
	else dockMap(block);
}

// a widget's [R] fetches its map afresh — the page may have been open long
// enough for new images to be out — without reloading the page. First in
// the cluster, shown only on a popped-out widget (CSS). Not on an
// interactive map, whose bar keeps its own [X]/[R] gate button
function buildReloadButton() {
	const btn = el('a', { class: 'rl-btn', text: '[R]', title: 'Ponovno učitaj kartu' });
	btn.addEventListener('click', () => reloadMap(btn.closest('.map-block')));
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
	const back = el('a', { text: 'Vrati' });
	back.addEventListener('click', () => dockMap(block));
	const gap = el('div', { class: 'map-gap', style: `height: ${rect.height}px;` }, [
		el('span', { text: 'Karta je izdvojena u prozor ·' }),
		back
	]);
	block._gap = gap;
	block.after(gap);
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

// back to the height the aspect gives at the width it has
function lockAspect(block) {
	if (!block.classList.contains('letterbox')) return;
	dlog(`lockAspect: ${block.dataset.mapId}`);
	block.classList.remove('free', 'letterbox');
	block.style.removeProperty('height');
	block.style.removeProperty('--po-img');
}

// the backdrop shows the image on screen: the active slide's, or the map's
// (a video has none, and the frame's own ground shows); followed on every
// load and slide change, and through a reload's fresh address
function syncBackdrop(block) {
	if (!block.classList.contains('letterbox')) return;
	const img = block.querySelector('.slide.active img') || block.querySelector('img');
	const src = img && (img.currentSrc || img.src);
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

function dockMap(block) {
	dlog(`dockMap: ${block.dataset.mapId}`);
	// a fullscreen iframe inside the widget is fixed on its own; take it down first
	const fs = block.querySelector('.if1.fullscreen');
	if (fs) exitFullscreen(fs);
	if (block._group) leaveGroup(block);
	unsnapPane(block);
	block.classList.remove('popout', 'free', 'grouped', 'letterbox', 'covered');
	['left', 'top', 'width', 'height', 'z-index', '--po-img'].forEach(p => block.style.removeProperty(p));
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
	document.querySelectorAll('.map-block.popout').forEach(dockMap);
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
	let k = 0;
	document.querySelectorAll('.map-block:not(.popout)').forEach(block => {
		popoutMap(block);
		const steps = Math.max(1, Math.floor((viewportHeight() - POPOUT_MARGIN - block.offsetHeight) / CASCADE_STEP));
		const step = k % steps, round = Math.floor(k / steps);
		k++;
		placePopout(block,
			snapColumnPx(snapColumns.left) + POPOUT_MARGIN + step * CASCADE_STEP + round * POPOUT_WIDTH / 2,
			POPOUT_MARGIN + step * CASCADE_STEP);
		raisePopout(block);
	});
}

// [x] on the board: the map leaves the list it is shown from — the widget
// goes, with its rows in the (hidden) table, and the list is stored without
// it (maps.js), as the dialog would store it after the map was unticked
function removeFromDashboard(block) {
	dlog(`removeFromDashboard: ${block.dataset.mapId}`);
	const id = block.dataset.mapId;
	snapPersistPaused = true;
	dockMap(block); // out of its column and group, a fullscreen taken down
	snapPersistPaused = false;
	const row = block.closest('tr');
	const next = row.nextElementSibling;
	const links = next && next.querySelector('.links-bottom') ? next : null;
	const last = links || row;
	const spacer = row.previousElementSibling && row.previousElementSibling.classList.contains('sp20') ? row.previousElementSibling
		: last.nextElementSibling && last.nextElementSibling.classList.contains('sp20') ? last.nextElementSibling : null;
	[links, spacer, row].forEach(node => { if (node) node.remove(); });
	removeMapFromList(id);
}

// ---------- the grid (desktop, on the board) ----------

// Graph paper under the widgets, and the lines a widget settles onto when let
// go. The cell is a size, not a count: the lines are its multiples, so they are
// whole pixels by construction whatever the window, the cells stay square on
// every screen, and the paper is one repeating gradient however fine it gets.
// Two edges land on the same line whenever they lie within half a cell of each
// other, so at 16 the grid forgives 8px — many times the fraction of a pixel an
// aspect-derived height used to leave between two widgets, which is what makes
// a snapped board exact where a placed one was not. Both switches are the
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

let gridShow = loadGridPrefs().show;
let gridSnap = loadGridPrefs().snap;

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
	fitTitles(block);
}

// on release only, never while the gesture runs: the widget follows the
// pointer and settles onto the grid when it is let go
function snapToGrid(blocks) {
	if (!gridSnap || !dashboardMode || !POPOUT_MQ.matches) return;
	blocks.forEach(block => {
		if (!block.classList.contains('fs-host')) snapBlockToGrid(block);
	});
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
// frame's document: the page never sees it, so the widget clicked into would
// stay under the one over it. Most maps are spared by their gate, an .overlay
// over the frame that takes the press, but a basic iframe (.if2) has none and
// an interactive one loses its own once the gate is let through. Nor can the
// page be told after the fact — the focus moving from one frame to another
// raises no event it can hear (see the blur handler below, which catches only
// the move in from the page itself). So a frame with another widget lying over
// it stops taking the pointer at all (`covered`, the CSS): the press lands on
// the widget instead and raises it, the class goes with the raise, and the
// frame is live for the next press. Click it to the front, then work the map —
// which is what a window does. A widget nothing overlaps is never covered, so
// a map standing on its own is untouched
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
	syncShadows(); // the same call sites: wherever a widget's rect or its order can have changed
}

// ---------- the shadow layer (desktop) ----------

// A widget's shadow belongs to what is behind the widgets, not to the widget
// beside it. Drawn by the widget itself it was painted in the widget's own
// place in the order, so of two widgets side by side the raised one laid its
// shadow across its neighbour, and the only way to be rid of it was to raise
// the neighbour in turn — which puts its shadow on the first one. So no widget
// carries a shadow any more: each one has a box of its own size in a single
// layer under the whole widget range (.po-shadows, over the page and the
// docked maps on it, the columns' ground, the graph paper and a fullscreen
// map), and that box carries the shadow. An outer box-shadow is clipped out of
// its own border box, so the box paints the halo alone and the widget sits on
// it exactly. Every widget is then over every shadow, whatever the order among
// themselves — which is what was wanted, and it lets a grouped widget have its
// shadow back: a member's now falls under the member beside it, not across it.
// A pane in a column has none (docked into the column's ground rather than
// floating over it), nor has a widget hosting a fullscreen map, whose box is
// not to be seen.
function shadowLayer() {
	let layer = document.querySelector('.po-shadows');
	if (!layer) document.body.appendChild(layer = el('div', { class: 'po-shadows' }));
	return layer;
}

function castsShadow(block) {
	return !isSnapped(block) && !block.classList.contains('fs-host');
}

// every widget's box placed on its rect, and any box left without a widget —
// one docked, or gone with the tbody — swept out of the layer
function syncShadows() {
	const live = new Set();
	allPopouts().forEach(block => {
		if (!castsShadow(block)) return;
		if (!block._shadow || !block._shadow.isConnected) {
			block._shadow = el('div', { class: 'po-shadow' });
			shadowLayer().appendChild(block._shadow);
		}
		// the rect as it is: a widget's place carries thousandths of a pixel
		// (subpixel(), moveGroup) and its shadow is to stand exactly on it
		const rect = block.getBoundingClientRect();
		block._shadow.style.cssText =
			`left: ${rect.left}px; top: ${rect.top}px; width: ${rect.width}px; height: ${rect.height}px;`;
		live.add(block._shadow);
	});
	const layer = document.querySelector('.po-shadows');
	if (layer) [...layer.children].forEach(box => { if (!live.has(box)) box.remove(); });
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), Math.max(min, max));
}

// the layout viewport: innerWidth counts the vertical scrollbar, under which
// a widget's right edge (and a right column) would then land — and so does
// clientWidth while the settings dialog keeps the scrollbar's gutter in its
// place (maps.js sets viewportGutter to its width for as long as it does)
let viewportGutter = 0;
function viewportWidth() {
	return document.documentElement.clientWidth - viewportGutter;
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
	// the shadows follow the gesture live: every drag and resize of a widget, a
	// group, a pane and a column comes through here, and updateCovered — which
	// syncs them otherwise — runs only once the gesture is over
	const move = (ev) => { onMove(ev.clientX - startX, ev.clientY - startY, ev); syncShadows(); };
	const stop = () => {
		document.removeEventListener('pointermove', move);
		document.removeEventListener('pointerup', stop);
		document.removeEventListener('pointercancel', stop);
		document.body.classList.remove('po-dragging');
		if (onEnd) onEnd();
	};
	document.body.classList.add('po-dragging');
	document.addEventListener('pointermove', move);
	document.addEventListener('pointerup', stop);
	document.addEventListener('pointercancel', stop);
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
		fitTitles(block); // the cluster may have changed width
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
// and it costs that widget's border the crispness of sitting on the grid,
// which is the lesser of the two. Thousandths: the layout unit is 1/64px
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

// resizing from any side or corner. Width is the dimension every widget has;
// a locked (aspect) widget derives its height from it, so a pull on its top or
// bottom edge is turned into the width that gives that height, and a corner
// follows whichever axis asks for more. Pulling the left or top edge keeps the
// opposite edge where it is by moving the widget along. The pulled edge is
// drawn by the other floating widgets too (magnets, as on drag): onto the
// facing edge of one beside it — above or below it, for a top or bottom edge
// — or into line with the like edge of one above or below it; exact for a
// width, and through the aspect ratio for a locked widget's height — whose
// width, once the height has asked for it, has a moving edge of its own to
// pull, so the widget lines up with the one above it by that edge too. A
// free pane in a column keeps the column's width: its top or bottom edge is
// drawn to the column's ends and the other panes, and the top it carries
// follows; the pulled edge stops at the column's end. A grouped floating
// widget's handles resize the whole group (resizeGroup); a grouped pane
// resizes on its own in its stack, which keeps together: the members above
// it move up with its top edge, the ones below move down with its bottom
// edge (the settle in layoutSnapColumn), and the stack's ends stop at the
// column's
function resizePopout(block, dir, e) {
	const members = groupMembers(block);
	const col = snapColumnOf(block);
	if (members.length > 1 && !col) return resizeGroup(members, dir, e);
	// the key decides per gesture, while the widget floats: Shift frees a
	// locked widget's aspect, and a plain drag locks a freed one again (in a
	// column the width is the column's, and a freed pane stays as it is)
	if (!col && e.shiftKey && !block.classList.contains('free')) unlockAspect(block);
	else if (!col && !e.shiftKey && block.classList.contains('letterbox')) lockAspect(block);
	const start = block.getBoundingClientRect();
	const free = block.classList.contains('free');
	const ratio = start.width / start.height;
	const maxWidth = popoutMaxWidth();
	const maxHeight = viewportHeight() - POPOUT_MARGIN;
	const magnets = col ? [] : magnetRects(block);
	const mates = col ? groupStarts(members.filter(m => m !== block)) : [];
	const above = mates.filter(s => s.top < start.top), below = mates.filter(s => s.top > start.top);
	const stackTop = Math.min(start.top, ...above.map(s => s.top));
	const stackBottom = Math.max(start.bottom, ...below.map(s => s.bottom));
	trackPopoutPointer(e, (dx, dy) => {
		let w = start.width, h = start.height;
		if (dir.includes('e')) w = start.width + dx;
		if (dir.includes('w')) w = start.width - dx;
		if (dir.includes('s')) h = start.height + dy;
		if (dir.includes('n')) h = start.height - dy;
		if (col) {
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
		}
		block.style.width = `${Math.round(w)}px`;
		// the laid-out height, exact for locked widgets where it follows the
		// width — off the rect, like start, so the two can be subtracted without
		// offsetHeight's rounding costing the north edge a pixel
		h = block.getBoundingClientRect().height;
		placePopout(block, dir.includes('w') ? start.right - w : start.left, dir.includes('n') ? start.bottom - h : start.top);
		fitTitles(block);
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
// the start ratio only approximates the width a wanted height asks for: a pull
// on the top or bottom edge landed beside its magnet by about the bar's share
// of the height, a dozen pixels, which is the whole of MAGNET. Setting the
// width and reading back the height it gave closes that, since the error left
// is the bar's share of the error — under a tenth — so the second pass lands
// on the pixel. Cheap enough per move: the height is read back once anyway
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
		members.forEach(fitTitles);
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
	if (handle) resizePopout(block, handle.dataset.dir, e);
	else dragPopout(block, e);
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
// so they stand whatever language the page comes to speak: R is the [R] the
// bar already carries, G the grid and S its snap. (K, which opens the dialog in
// maps.js — which keeps that key and the dialog's own Escape — was here before
// this and is the Croatian Karte.) The three are also the tab's glyph cluster,
// which is where they can be read off: [R] [G] [S], each titled with its key.
// None of this reaches the page while an iframe holds
// the focus — a press inside a frame belongs to the frame's document, and
// these maps are another origin — so a click on the page or on a title bar
// comes first, as it does for the pointer (see updateCovered). The dialog's
// guard is repeated here: not from a text field, whose own Escape is a way
// out of the field, and not under a modifier, which belongs to the browser
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
	const nudge = NUDGE_KEYS[e.key];
	if (!nudge) return;
	e.preventDefault(); // the page would scroll under it
	const step = e.shiftKey ? 1 : GRID_CELL;
	nudgePopout(nudge[0] * step, nudge[1] * step);
});

// the dialog is over everything and owns Escape while it is open; under it
// Escape ends a fullscreen map, and under that it does nothing — backing out
// is not a reason to take an arrangement apart
function escapeFullscreen() {
	const panel = document.getElementById('mapSettings');
	if (panel && !panel.hidden) return;
	const fs = document.querySelector('.if1.fullscreen');
	if (fs) exitFullscreen(fs);
}

// every widget whose bar offers [R], once each — a titled slideshow carries
// one on every slide. An interactive map carries none at all, and reloadMap()
// reaches only a basic iframe (.if2) besides: its feed is live of its own
// accord, and navigating its frame again would cost it its pan and its zoom
// for nothing. So this is the images, the slideshows, the videos and the
// basic frames, which is what has to be fetched to be new
function reloadAllMaps() {
	allPopouts().filter(block => block.querySelector('.rl-btn')).forEach(reloadMap);
}

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

// widgets are a desktop thing: shrinking below the breakpoint puts them back
POPOUT_MQ.addEventListener('change', (e) => {
	if (e.matches) return;
	snapPersistPaused = true; // the stored arrangement is kept for a desktop window
	dockAllPopouts();
	snapPersistPaused = false;
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
// column there: a strip of the viewport's height in which panes sit freely
// one above another, the page laid out in what is left between the columns
// (body padding, through --snap-l/--snap-r). A pane is still a pop-out
// widget — same block, same fixed positioning, nothing moves in the DOM —
// only its width is the column's and its place comes from
// layoutSnapColumns(): a column has a width and each pane a top (a free pane
// a height too), all fractions of the viewport so a window resize keeps the
// proportions. Up and down the column a pane moves as a widget does over the
// page, the column's ends and the other panes its magnets; pulled sideways
// it floats again. The column's inner edge is its resize handle (.snap-ui,
// above the panes); .snap-col paints the column's ground below them. A free
// (iframe) pane keeps its own height and resizes by its top and bottom edge;
// a locked one takes the column's width, pulled in to what its content
// spans, and the height that gives it. A group in a column is a stack, kept
// one under another by every layout (settleSnapStacks), so the column's
// width or the window changing under it changes its members' heights and
// not their touch. A fullscreen map in a pane fills what the column leaves
// free around the pane (fitSnapFullscreen).
//
// The columns can take the whole width — two of them meeting, or one at full
// width — which hides the page (body.snap-full also drops its scrollbar). An
// edge dragged that close snaps shut; a double-click on an edge shuts it too,
// or opens it back to the widths from before. Two columns that meet share one
// seam handle that moves width between them.
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
		col.panes.forEach(p => fitTitles(p.block)); // the column's width is theirs
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

// a pane takes the column's width: a free one with the height it carries, a
// locked one with the height its aspect gives at that width, pulled in to
// what its content spans (an image stops at its natural width and a map with
// a maxWidth at that, and the title bar and indicators must not run on past
// them across a wider column) and centred in the column. Its top is the one
// it carries, held inside the viewport
function fitSnapPane(pane, x, width) {
	const block = pane.block;
	block.style.width = `${width}px`;
	if (pane.height !== undefined) {
		block.style.height = `${Math.round(clamp(pane.height * viewportHeight(), POPOUT_MIN_HEIGHT, viewportHeight()))}px`;
	} else {
		const content = snapContentWidth(block);
		if (content && content < block.offsetWidth - 1) block.style.width = `${Math.ceil(content)}px`;
	}
	block.style.left = `${Math.round(x + (width - block.offsetWidth) / 2)}px`;
	block.style.top = `${Math.round(clamp(pane.top * viewportHeight(), 0, Math.max(0, viewportHeight() - block.offsetHeight)))}px`;
}

// the narrowest of what is on screen and constrained on its own: a title bar
// carries the map's maxWidth, an image or video its natural width (an image
// still loading measures 0 and does not count — the load listener below fits
// again once it has)
function snapContentWidth(block) {
	const widths = [...block.querySelectorAll('.radartitle, img, video')]
		.map(node => node.getBoundingClientRect().width)
		.filter(w => w > 0);
	return widths.length ? Math.min(...widths) : 0;
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
	// locks it again, where it stands — a pane's height goes with it
	const title = e.target.closest('.map-block.popout.letterbox .radartitle:not(.fullscreen)');
	if (title && !e.target.closest('a')) {
		const block = title.closest('.map-block');
		lockAspect(block);
		const pane = snapPaneOf(block);
		if (pane) delete pane.height;
		layoutSnapColumns();
		fitTitles(block);
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
function snapLayout() {
	const layout = {};
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
				const entry = { id: p.block.dataset.mapId, top: roundFraction(p.top) };
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
				id: block.dataset.mapId,
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
function hasFullscreen(mapId) {
	const map = MAP_CATALOG.find(m => m.id === mapId);
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
			if (!(p && typeof p.id === 'string' && mapIds.includes(p.id) && !seen.has(p.id))) return;
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
			.filter(f => f && typeof f.id === 'string' && mapIds.includes(f.id) && !seen.has(f.id)
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
	if (!layout || !POPOUT_MQ.matches) return;
	snapPersistPaused = true; // what is being applied is already what is stored
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
			const block = document.querySelector(`.map-block[data-map-id="${CSS.escape(id)}"]`);
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
		const block = document.querySelector(`.map-block[data-map-id="${CSS.escape(id)}"]`);
		if (!block || block.classList.contains('popout')) return;
		popoutMap(block);
		if (height && !block.classList.contains('free')) unlockAspect(block);
		block.style.width = `${Math.round(clamp(width * viewportWidth(), POPOUT_MIN_WIDTH, popoutMaxWidth()))}px`;
		if (block.classList.contains('free') && height)
			block.style.height = `${Math.round(clamp(height * viewportHeight(), POPOUT_MIN_HEIGHT, viewportHeight() - POPOUT_MARGIN))}px`;
		placePopout(block, left * viewportWidth(), top * viewportHeight());
		raisePopout(block); // in stored order, so the last one is on top again
		setGroup(block, group);
		if (fullscreen) toFullscreen.push(block);
	});
	if (dashboardMode) popoutRest(); // the maps of the list the layout does not place: onto the board
	// once everything stands where it belongs: a pane's fullscreen is placed
	// by its column, and main.js reads off the pane whether to lock the page
	toFullscreen.forEach(restoreFullscreen);
	updateGroups();
	updateCovered(); // persistence is paused, so this is not reached through it
	snapPersistPaused = false;
}

function applyStoredSnapLayout() {
	applySnapLayout(sanitizeSnapLayout(getActiveMapPrefs().layout, resolveMapIds()));
}

let snapPersistPaused = false;

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
	const layout = snapLayout();
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
	// the settings panel, if open, names the arrangement and offers Ažuriraj off it
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
			fitTitles(block);
			syncBackdrop(block); // the image on screen may be another
			syncShadows(); // a floating locked widget's height changed with it, and its shadow is its size
		}, 0);
	}, true);
});
