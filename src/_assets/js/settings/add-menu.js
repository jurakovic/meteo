import { el } from '../lib/dom.js';
import { EVENTS, on } from '../lib/events.js';
import { clamp, viewportHeight, viewportWidth } from '../lib/geometry.js';
import { CATEGORY_GLYPHS, MAP_CATALOG } from '../maps/catalog.js';
import { findTerms, matchesFind } from '../maps/find.js';
import { resolveMapIds } from '../maps/prefs.js';
import { registerCommand } from '../page/commands.js';
import { isMapEnabled } from '../remote-config.js';
import { addToDashboard, isDashboard } from '../widgets/board.js';

// The tab's [+] menu: a find box over the maps the board does not show yet.
// See INTERNALS.md, The add menu.
let msAdd = null; // { menu, anchor } while open

const MS_ADD_MAX_HEIGHT = 420; // a menu, not a second dialog: the list scrolls past this

/** @param {HTMLElement} anchor */
function toggleMsAdd(anchor) {
	if (msAdd) closeMsAdd();
	else openMsAdd(anchor);
}

export function closeMsAdd() {
	if (!msAdd) return;
	msAdd.menu.remove();
	msAdd = null;
	document.body.classList.remove('ms-add-open');
	document.removeEventListener('pointerdown', msAddOutside, true);
}

// captured, so a press that lands on a widget still shuts the menu first; the
// [+] itself is left to its own click, which toggles
function msAddOutside(e) {
	if (!msAdd || msAdd.menu.contains(e.target) || msAdd.anchor.contains(e.target)) return;
	closeMsAdd();
}

function openMsAdd(anchor) {
	if (!isDashboard()) return;
	closeMsAdd();
	const onBoard = new Set(resolveMapIds());
	// by name, as the dialog's Naziv sorts: a menu is scanned for a name, not a kind
	const maps = MAP_CATALOG.filter(map => isMapEnabled(map.id) && !onBoard.has(map.id))
		.sort((a, b) => a.name.localeCompare(b.name, 'hr'));

	const input = el('input', { type: 'text', class: 'ms-add-input', placeholder: 'Traži kartu…', spellcheck: 'false', autocomplete: 'off' });
	const list = el('div', { class: 'ms-add-list' });
	const empty = el('div', { class: 'ms-add-empty', text: maps.length ? 'Nema pogodaka' : 'Sve su karte na ploči' });
	const menu = el('div', { class: 'ms-add' }, [input, list, empty]);
	let items = [];
	let active = -1;

	function setActive(index) {
		if (items[active]) items[active].classList.remove('active');
		active = index;
		if (!items[active]) return;
		items[active].classList.add('active');
		items[active].scrollIntoView({ block: 'nearest' });
	}

	function pick(mapId) {
		closeMsAdd();
		addToDashboard(mapId);
	}

	function fill() {
		const terms = findTerms(input.value);
		items = maps.filter(map => matchesFind(map, terms)).map(map => {
			const item = el('div', { class: 'ms-add-item', 'data-map-id': map.id }, [
				el('span', { class: 'ms-glyph', text: CATEGORY_GLYPHS[map.category] || '' }),
				document.createTextNode(map.name)
			]);
			item.addEventListener('mousedown', (e) => e.preventDefault()); // the focus stays in the box
			item.addEventListener('mousemove', () => { if (items[active] !== item) setActive(items.indexOf(item)); });
			item.addEventListener('click', () => pick(map.id));
			return item;
		});
		list.replaceChildren(...items);
		empty.hidden = items.length > 0;
		active = -1;
		setActive(items.length ? 0 : -1);
	}

	input.addEventListener('input', fill);
	input.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			if (!items.length) return;
			const step = e.key === 'ArrowDown' ? 1 : -1;
			setActive((active + step + items.length) % items.length);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (items[active]) pick(items[active].getAttribute('data-map-id'));
		} else if (e.key === 'Escape') {
			e.preventDefault();
			// a term is cleared first, as in the dialog's box; an empty box shuts
			if (input.value) { input.value = ''; fill(); } else closeMsAdd();
		}
	});

	fill();
	document.body.appendChild(menu);
	msAdd = { menu, anchor };
	document.body.classList.add('ms-add-open');
	placeMsAdd();
	document.addEventListener('pointerdown', msAddOutside, true);
	input.focus();
}

// under the tab, its left edge under the [+], held inside the viewport
function placeMsAdd() {
	if (!msAdd) return;
	const { menu, anchor } = msAdd;
	const tab = anchor.closest('.ms-tab');
	const top = (tab || anchor).getBoundingClientRect().bottom + 4;
	const width = menu.offsetWidth;
	const left = clamp(anchor.getBoundingClientRect().left - 8, 8, Math.max(8, viewportWidth() - width - 8));
	menu.style.left = `${Math.round(left)}px`;
	menu.style.top = `${Math.round(top)}px`;
	menu.style.maxHeight = `${Math.max(120, Math.min(MS_ADD_MAX_HEIGHT, Math.round(viewportHeight() - top - 16)))}px`;
}

// the menu shuts when a dialog opens and when the window is resized
export function initAddMenu() {
	// the tab's [+], on the board
	registerCommand('add-map', { run: (glyph) => toggleMsAdd(glyph) });
	on(EVENTS.dialogToggled, ({ visible }) => { if (visible) closeMsAdd(); });

	window.addEventListener('resize', () => closeMsAdd());
}
