// The settings dialog (Karte): presets, the pick and order of maps, the
// board's mode and grid, auto-refresh, saved presets and share links.
// Nothing is applied until Primijeni, except the grid and refresh switches.

import { el, flashLabel } from '../lib/dom.js';
import { DESKTOP_MQ } from '../lib/media.js';
import { catalogMap, CATEGORY_GLYPHS, MAP_CATALOG } from '../maps/catalog.js';
import { findTerms, matchesFind } from '../maps/find.js';
import { activePresetId, clearSharedMapView, prefsMapIds, presetMapIds, resolveMapIds, sameMapIds, saveMapPrefs, sharedMapView } from '../maps/prefs.js';
import { allPresets, cleanPresetName, deleteUserPreset, findUserPresetByName, hiddenPresets, hideablePresets, hideAllPresets, isBoardPreset, isHideablePreset, isPresetHidden, isUserPresetId, MAP_PRESETS, PRESET_NAME_MAX, saveUserPresets, setPresetHidden, showAllPresets, storeUserPreset, uniquePresetName, userPresets, visiblePresets } from '../maps/presets.js';
import { renderMaps } from '../maps/render.js';
import { copyMapViewLink, presetSharePrefs } from '../maps/share.js';
import { initDynamicContent } from '../page/content.js';
import { buildDialogHandles, setDialogVisible } from '../page/dialog.js';
import { isMapEnabled } from '../remote-config.js';
import { arrangeBoard } from '../widgets/arrange.js';
import { isDashboard } from '../widgets/board.js';
import { isGridShown, isGridSnapped, setGridPrefs } from '../widgets/grid.js';
import { applySnapLayout, currentSnapLayout, isDashboardView, sameSnapLayout, sanitizeSnapLayout } from '../widgets/layout.js';
import { dockAllPopouts } from '../widgets/popout.js';
import { isRefreshOn, REFRESH_CHOICES, refreshEveryMinutes, refreshLabel, setRefreshPrefs } from '../widgets/refresh.js';

// opening and shutting — the lock, the gutter, the backdrop, the stored
// geometry — is the chrome both dialogs share (page/dialog.js). The arrow is not set
// here but off the event below, so a shut this function never made (the
// backdrop, Escape, the manual opening over it) moves it just the same
function setMapSettingsVisible(panel, visible) {
	setDialogVisible(panel, visible);
}

export function toggleMapSettings() {
	const panel = document.getElementById('mapSettings');
	if (!panel) return;
	if (panel.hidden) buildMapSettings(panel); // rebuilt from what is stored, so a dismissal drops the edits
	setMapSettingsVisible(panel, panel.hidden);
}

export function initMapSettings() {
	// the picker from the keyboard, for wherever the page's button is out of reach.
	// Escape is the shared chrome's, since it shuts whichever dialog is up
	document.addEventListener('keydown', (e) => {
		if (e.altKey || e.ctrlKey || e.metaKey) return;
		if (e.key !== 'k' && e.key !== 'K') return;
		if (e.target.matches && e.target.matches('input:not([type="radio"]):not([type="checkbox"]), textarea, [contenteditable]')) return;
		e.preventDefault();
		toggleMapSettings();
	});

	// Enter is Primijeni while the picker is up, wherever the focus is in it — a
	// chip, a checkbox, a button just pressed. Captured and kept from the focused
	// button, which would otherwise take it as its own click: a press on Nadzorna
	// ploča followed by Enter would tick the mode back off instead of applying it
	// (Space still presses a button). A text field keeps its own Enter (the preset
	// name editors), and so does the interval list
	document.addEventListener('keydown', (e) => {
		if (e.key !== 'Enter' || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.isComposing) return;
		const panel = document.getElementById('mapSettings');
		if (!panel || panel.hidden) return;
		if (e.target.matches && e.target.matches('input:not([type="radio"]):not([type="checkbox"]), textarea, select, [contenteditable]')) return;
		const apply = panel.querySelector('.ms-apply');
		if (!apply) return;
		e.preventDefault();
		e.stopPropagation();
		apply.click();
	}, true);

	// the page's Karte button wears the picker's state as an arrow
	document.addEventListener('dialog-toggled', (e) => {
		if (e.detail.panel.id !== 'mapSettings') return;
		const arrow = document.querySelector('.buttons button.btn .arrow');
		if (arrow) arrow.textContent = e.detail.visible ? '▲' : '▼';
	});
}

function buildMapSettings(panel) {
	panel.replaceChildren();

	// two sections: the selected block is the render order (draggable), the
	// available block below is only a finding surface and can be sorted freely
	const selectedDiv = el('div', { class: 'ms-list ms-selected' });
	const availableDiv = el('div', { class: 'ms-list ms-available' });

	let sortKey = 'zadano';
	let sortAsc = true;

	function compareRows(a, b) {
		const ma = catalogMap(a.getAttribute('data-map-id'));
		const mb = catalogMap(b.getAttribute('data-map-id'));
		const dir = sortAsc ? 1 : -1;
		if (sortKey === 'naziv') return ma.name.localeCompare(mb.name, 'hr') * dir;
		if (sortKey === 'vrsta') return (ma.category.localeCompare(mb.category, 'hr') || ma.name.localeCompare(mb.name, 'hr')) * dir;
		return (MAP_CATALOG.indexOf(ma) - MAP_CATALOG.indexOf(mb)) * dir;
	}

	function sortAvailable() {
		[...availableDiv.children].sort(compareRows).forEach(row => availableDiv.appendChild(row));
	}

	const sortLinks = {};
	const sortDiv = el('div', { class: 'ms-sort' }, [el('span', { text: 'Poredaj:' })]);
	[['zadano', 'Zadano'], ['naziv', 'Naziv'], ['vrsta', 'Vrsta']].forEach(([key, label]) => {
		const link = el('a', { text: label });
		link.addEventListener('click', () => {
			if (sortKey === key) sortAsc = !sortAsc;
			else { sortKey = key; sortAsc = true; }
			updateSortLinks();
			sortAvailable();
		});
		sortLinks[key] = { link, label };
		sortDiv.appendChild(link);
	});

	function updateSortLinks() {
		for (const [key, { link, label }] of Object.entries(sortLinks)) {
			const active = key === sortKey;
			link.classList.toggle('active', active);
			link.textContent = active ? `${label} ${sortAsc ? '▲' : '▼'}` : label;
		}
	}
	updateSortLinks();

	// the box narrows the available list alone. The order above it is the page's
	// own and is reordered by dragging, which a list with rows missing out of it
	// could not be: a row dropped between two neighbours would land somewhere
	// else entirely once the term was cleared
	const findInput = el('input', { type: 'text', class: 'ms-find-input', placeholder: 'Traži karte…', 'aria-label': 'Traži karte' });
	const findClear = el('a', { class: 'ms-find-clear', text: '×', title: 'Očisti (Esc)' });
	const findDiv = el('div', { class: 'ms-find' }, [findInput, findClear]);

	// hidden by a class rather than taken out of the list: a row carries its
	// checkbox and its drag handler, and the term is cleared far more often
	// than the catalog changes
	function applyFind() {
		const terms = findTerms(findInput.value);
		let hits = 0;
		[...availableDiv.children].forEach(row => {
			const map = catalogMap(row.getAttribute('data-map-id'));
			const hit = !map || matchesFind(map, terms);
			row.classList.toggle('ms-filtered', !hit);
			if (hit && !row.classList.contains('ms-off')) hits++;
		});
		findDiv.classList.toggle('ms-find-set', terms.length > 0);
		availableDiv.classList.toggle('ms-no-hits', terms.length > 0 && hits === 0);
	}

	findInput.addEventListener('input', applyFind);

	findInput.addEventListener('keydown', (e) => {
		if (e.key !== 'Escape') return;
		// the dialog's own Escape stands down inside a text field, so both ways
		// out are this handler's: the term first, the dialog once there is none
		e.preventDefault();
		if (findInput.value) {
			findInput.value = '';
			applyFind();
		} else {
			setMapSettingsVisible(panel, false);
		}
	});

	findClear.addEventListener('click', () => {
		findInput.value = '';
		applyFind();
		findInput.focus();
	});

	function markCustom() {
		panel.querySelector('input[name="msPreset"][value="custom"]').checked = true;
		// the edit may have just put the list out of step with the preset it came
		// from, or brought it back into step, which is what both marks hang off
		updateOriginMark();
		renderManage();
	}

	// pointer-events drag reorder: works for both mouse and touch (the HTML5
	// drag-and-drop API does not fire on mobile); touch-action: none on the
	// handle keeps the browser from scrolling instead
	function enableDragReorder(handle, row) {
		handle.addEventListener('pointerdown', (e) => {
			e.preventDefault(); // no text selection while dragging with a mouse
			// no pointer capture at all: touch pointers implicitly capture the
			// handle, and any capture (implicit or moved elsewhere) misbehaves
			// once the row moves in the DOM; releasing it lets the events
			// hit-test naturally and bubble to the document-level listeners
			if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
			row.classList.add('dragging');
			const startNext = row.nextElementSibling;
			let lastY = e.clientY;
			let scrollDir = 0;
			let raf = null;

			// move the row before the first sibling whose midpoint is below the pointer
			const reorder = () => {
				const target = [...selectedDiv.children].find(sibling =>
					sibling !== row && lastY < sibling.getBoundingClientRect().top + sibling.offsetHeight / 2);
				if (target) {
					if (target.previousElementSibling !== row) selectedDiv.insertBefore(row, target);
				} else if (selectedDiv.lastElementChild !== row) {
					selectedDiv.appendChild(row);
				}
			};

			// keep scrolling (and reordering) while the pointer rests near an edge
			// of the dialog's body, which is what scrolls (the page holds still)
			const scroller = row.closest('.ms-body');
			const autoScroll = () => {
				if (scrollDir !== 0) {
					scroller.scrollBy(0, scrollDir);
					reorder();
				}
				raf = requestAnimationFrame(autoScroll);
			};

			const onMove = (ev) => {
				if (ev.buttons === 0) { onEnd(); return; } // pointerup was missed (released outside the window)
				lastY = ev.clientY;
				const margin = 60;
				const bounds = scroller.getBoundingClientRect();
				scrollDir = lastY < bounds.top + margin ? -8 : (lastY > bounds.bottom - margin ? 8 : 0);
				reorder();
			};

			const onEnd = () => {
				document.removeEventListener('pointermove', onMove);
				document.removeEventListener('pointerup', onEnd);
				document.removeEventListener('pointercancel', onEnd);
				cancelAnimationFrame(raf);
				row.classList.remove('dragging');
				if (row.nextElementSibling !== startNext) markCustom();
			};

			document.addEventListener('pointermove', onMove);
			document.addEventListener('pointerup', onEnd);
			document.addEventListener('pointercancel', onEnd);
			raf = requestAnimationFrame(autoScroll);
		});
	}

	function buildRow(map, checked) {
		const checkbox = el('input', { type: 'checkbox' });
		checkbox.checked = checked;
		const handle = el('span', { class: 'ms-handle', text: '≡', title: 'Povuci za premještanje' });
		// a map switched off keeps its row, hidden, so the list read back off the
		// rows (selectedMapIds) still holds it where it was
		const row = el('div', { class: isMapEnabled(map.id) ? 'ms-item' : 'ms-item ms-off', 'data-map-id': map.id }, [
			el('label', {}, [
				checkbox,
				el('span', { class: 'ms-glyph', text: CATEGORY_GLYPHS[map.category] || '' }),
				document.createTextNode(map.name)
			]),
			handle
		]);
		checkbox.addEventListener('change', () => {
			// checking appends to the page order; unchecking returns the row to the sorted shelf
			if (checkbox.checked) {
				selectedDiv.appendChild(row);
			} else {
				availableDiv.appendChild(row);
				sortAvailable();
				applyFind(); // the row arrives unjudged, and a term may be standing
			}
			markCustom();
		});
		enableDragReorder(handle, row);
		return row;
	}

	function fillList(selectedIds) {
		selectedDiv.replaceChildren();
		availableDiv.replaceChildren();
		selectedIds.forEach(id => {
			const map = catalogMap(id);
			if (map) selectedDiv.appendChild(buildRow(map, true));
		});
		MAP_CATALOG.filter(map => !selectedIds.includes(map.id))
			.forEach(map => availableDiv.appendChild(buildRow(map, false)));
		sortAvailable();
		// the term outlives the list it was typed over: picking a preset is not
		// the end of looking for something, and the rows are built anew here
		applyFind();
	}

	const presetsDiv = el('div', { class: 'ms-presets' });

	// which preset the list in the picker came from, built-in or saved. Editing
	// it flips the bar to "Prilagođeno" (see markCustom), so the selection can no
	// longer say where the list started: this is what the dot on the origin chip
	// and the "Ažuriraj" link on the saved row both hang off. Null whenever the
	// list is nobody's — a stored custom view, or a shared one matching nothing.
	let editingPresetId = activePresetId() === 'custom' ? null : activePresetId();

	// the board is a mode of the view the panel edits, not a place it sends you:
	// the mode row's button only ticks this, and Primijeni builds the view from
	// it along with the list (layoutForPrefs). Starts at what is on screen, so
	// opening the panel and applying anything unchanged changes nothing.
	let dashboardChecked = isDashboardView();

	// the board's grid. Unlike the mode beside them these take effect at once —
	// they are a way of working, not a view to be applied — and they are the
	// browser's rather than the view's (widgets/grid.js stores them), so they start at
	// what is set and keep it whether or not the board is on
	let gridChecked = isGridShown();
	let snapChecked = isGridSnapped();

	// rebuilt whenever the saved presets change, so they sit among the
	// built-ins and stay selectable the same way
	function renderPresets(selectedId) {
		presetsDiv.replaceChildren();
		const options = [...visiblePresets(), { id: 'custom', name: 'Prilagođeno' }];
		// a hidden preset has no radio to check, and the maps on screen are still
		// its own, so the selection becomes custom rather than silently reverting
		if (!options.some(preset => preset.id === selectedId)) selectedId = 'custom';
		options.forEach(preset => {
			const radio = el('input', { type: 'radio', name: 'msPreset', value: preset.id });
			radio.checked = preset.id === selectedId;
			radio.addEventListener('change', () => {
				// switching to a named preset previews its whole view: its list and
				// its mode, since a preset saved as a board is a board and a built-in,
				// carrying no layout, is the page. "Prilagođeno" keeps both as they are
				if (preset.id !== 'custom') {
					fillList(presetMapIds(preset.id));
					setDashboardChecked(isBoardPreset(preset));
				}
				// picking "Prilagođeno" by hand detaches the list from wherever it
				// came from: no dot, and no row offering to take the edits back
				editingPresetId = preset.id === 'custom' ? null : preset.id;
				updateOriginMark();
				renderManage();
			});
			// a corner mark on the saved ones, so the two kinds stay apart in the
			// bar the way the management list below already keeps them apart
			// and the board's blue edge (the mode row's) on a preset that is a board
			const chipClass = 'ms-chip' + (isUserPresetId(preset.id) ? ' ms-user' : '') + (isBoardPreset(preset) ? ' ms-board' : '');
			// the name rides in a span rather than a bare text node so the chip
			// styling can hang off the radio's :checked as a sibling selector
			presetsDiv.appendChild(el('label', {}, [radio, el('span', { class: chipClass, text: preset.name, title: isBoardPreset(preset) ? 'Nadzorna ploča' : undefined })]));
		});
		// carries no content: it exists so the last line has something to give
		// its leftover width to, leaving those chips at their natural size
		// while the full lines above still stretch to both edges
		presetsDiv.appendChild(el('span', { class: 'ms-fill' }));
		updateOriginMark(); // the chips are new, so the dot has to be put back
	}

	// The dot marks the preset the list on screen started from, once it no longer
	// matches it. "Prilagođeno" keeps the selection — what travels in a share link
	// is a bare list, and a chip left looking selected would promise a name the
	// payload cannot carry — so the dot says which named view the edits are a copy
	// of without claiming to be it. Clicking that chip reloads the preset and
	// drops the edits, which the radio already does: it is the unchecked one.
	function updateOriginMark() {
		presetsDiv.querySelectorAll('.ms-origin').forEach(chip => chip.classList.remove('ms-origin'));
		const preset = allPresets().find(p => p.id === editingPresetId);
		// a hidden preset has no chip to mark, hence the guard on the radio
		if (!preset || sameMapIds(preset.maps, selectedMapIds())) return;
		// compared rather than built into a selector: ids come from localStorage,
		// where a hand-edited one could carry a quote and throw on querySelector
		const radio = [...presetsDiv.querySelectorAll('input')].find(input => input.value === editingPresetId);
		if (radio) radio.nextElementSibling.classList.add('ms-origin');
	}

	// the list first: renderPresets reads it back to decide where the dot goes,
	// and an empty picker would read as "edited away from the origin"
	fillList(resolveMapIds());

	renderPresets(activePresetId());

	function checkedPresetId() {
		const checked = panel.querySelector('input[name="msPreset"]:checked');
		return checked ? checked.value : 'zadano';
	}

	// the selected block holds exactly the checked rows, in render order
	function selectedMapIds() {
		return [...selectedDiv.children].map(row => row.getAttribute('data-map-id'));
	}

	function readPanelPrefs() {
		const presetId = checkedPresetId();
		if (presetId === 'custom') return { preset: 'custom', maps: selectedMapIds() };
		return { preset: presetId };
	}

	// the mode is the panel's, not the arrangement's: whatever layout is going to
	// be applied, the toggle decides whether it is a board. Ticked, it turns any
	// layout into one — a built-in's nothing included, which applySnapLayout then
	// fills with every map of the list. Unticked, a board loses its placements
	// along with the flag: a board holds the whole list as widgets, and over the
	// visible page that is a pile rather than an arrangement.
	// It runs before sanitizeSnapLayout rather than after, so what it marks a
	// board is held to what a board can hold — no columns — by the same guard
	// every layout read back from storage or a link passes
	function withDashboard(layout, on) {
		if (!on) return layout && layout.dashboard ? null : layout;
		const board = Object.assign({}, layout);
		board.dashboard = true;
		return board;
	}

	// the arrangement to go with a prefs object. A preset is a whole view:
	// applying a saved one brings its own arrangement (none, if it was saved
	// with nothing popped out), and a built-in has none, so everything docks.
	// Only the custom list keeps what is on screen, as far as its maps allow —
	// that is an edit of the current view, not a switch to another one
	function layoutForPrefs(prefs) {
		const stored = prefs.preset === 'custom'
			? currentSnapLayout()
			: (userPresets.find(p => p.id === prefs.preset) || {}).layout; // a built-in has none
		return sanitizeSnapLayout(withDashboard(stored, dashboardChecked), prefsMapIds(prefs));
	}

	// the arrangement on screen, held to the list in the picker (a map unchecked
	// there cannot stay a pane) and to the mode in the row, so what a preset
	// saves and what Ažuriraj counts as an edit are the view Primijeni would build
	function selectedLayout() {
		return sanitizeSnapLayout(withDashboard(currentSnapLayout(), dashboardChecked), selectedMapIds());
	}

	// the panel's own share button carries whatever is on screen, expanding a
	// saved preset the same way the per-preset links do — with the panel's mode
	// on it either way, since the link carries the view Primijeni would build
	function readSharePrefs() {
		const prefs = readPanelPrefs();
		const layout = layoutForPrefs(prefs);
		const preset = userPresets.find(p => p.id === prefs.preset);
		const shared = preset ? presetSharePrefs(preset) : prefs;
		if (layout) shared.layout = layout; else delete shared.layout;
		return shared;
	}

	// what is snapped, and a way to put it all back; shown only while there is
	// something to say. The line is the panel's only sign that the arrangement
	// is part of the view a preset saves and a link carries
	const layoutDiv = el('div', { class: 'ms-layout' });

	function layoutParts() {
		const layout = currentSnapLayout() || {};
		const parts = [];
		if (layout.left) parts.push(`lijevo ${layout.left.panes.length}`);
		if (layout.right) parts.push(`desno ${layout.right.panes.length}`);
		if (layout.floating) parts.push(`u prozoru ${layout.floating.length}`);
		return parts;
	}

	// the board is another way of viewing altogether, so it gets a row of its
	// own with a button, not a link among the others — a toggle, though, not a
	// way onto it: it ticks dashboardChecked and nothing moves until Primijeni,
	// like the ticks in the list beside it. Whether it is ticked is the lit
	// band's (.ms-on) to say, and what is on screen the layout line's, so the
	// row never narrates. Beside it the board's two grid switches, which only
	// mean anything on it: greyed and unclickable while it is off, their state
	// kept all the same, since they are a way of working rather than a view
	const modeDiv = el('div', { class: 'ms-mode' });

	function buildGridToggle(label, checked, onChange) {
		const box = el('input', { type: 'checkbox' });
		box.checked = checked;
		box.disabled = !dashboardChecked;
		box.addEventListener('change', () => onChange(box.checked));
		return el('label', { class: 'ms-grid' + (dashboardChecked ? '' : ' ms-off') }, [box, el('span', { text: label })]);
	}

	function renderModeRow() {
		modeDiv.replaceChildren();
		modeDiv.hidden = !DESKTOP_MQ.matches; // the widgets and the board are a desktop thing
		modeDiv.classList.toggle('ms-on', dashboardChecked);
		const btn = el('button', { type: 'button', class: 'btn', 'aria-pressed': String(dashboardChecked) }, [
			document.createTextNode('Nadzorna ploča '),
			el('span', { class: 'beta', text: 'beta' })
		]);
		btn.addEventListener('click', () => setDashboardChecked(!dashboardChecked));
		// these take effect on the tick, not on Primijeni: they are a way of
		// working on the board rather than part of the view it shows, so there is
		// nothing to hold back — tick the grid on, see it, shut the dialog
		// arranging acts on the board that is up, not on the tick that may yet be
		// applied: with the mode ticked but not yet applied there is no board to
		// arrange, so it waits for Primijeni rather than doing nothing on a press.
		// And it needs the tick as well, standing down with the grid switches
		// when the mode is unticked over a board that is still up
		const tile = el('button', { type: 'button', class: 'btn ms-arrange', title: 'Posloži u mrežu (A)' }, [
			document.createTextNode('Posloži')
		]);
		tile.disabled = !dashboardChecked || !isDashboard();
		tile.addEventListener('click', () => arrangeBoard());
		modeDiv.append(btn,
			buildGridToggle('Prikaži mrežu', gridChecked, (on) => { gridChecked = on; setGridPrefs(gridChecked, snapChecked); }),
			buildGridToggle('Poravnaj uz mrežu', snapChecked, (on) => { snapChecked = on; setGridPrefs(gridChecked, snapChecked); }),
			tile);
	}
	renderModeRow();

	// the clock. Its own row and not the mode row above: that one is the board's
	// and stands down on a phone, where a page left open goes just as stale
	const refreshDiv = el('div', { class: 'ms-refresh' });

	function renderRefreshRow() {
		refreshDiv.replaceChildren();
		refreshDiv.classList.toggle('ms-on', isRefreshOn());
		const every = el('select', { class: 'ms-refresh-every', 'aria-label': 'Razmak osvježavanja' });
		REFRESH_CHOICES.forEach(minutes => {
			const option = el('option', { value: String(minutes), text: `${minutes} min` });
			if (minutes === refreshEveryMinutes()) option.selected = true;
			every.appendChild(option);
		});
		const box = el('input', { type: 'checkbox' });
		box.checked = isRefreshOn();
		// as with the grid, this takes effect on the tick and not on Primijeni:
		// it is a way of working, so there is nothing to hold back
		const apply = () => setRefreshPrefs(box.checked, Number(every.value));
		box.addEventListener('change', apply);
		every.addEventListener('change', apply);
		// the time is written here rather than left to the next tick: the row is
		// not in the document yet, so the sweep that writes both labels cannot
		// find it, and it would read empty for the first second it is on screen
		const left = isRefreshOn() ? refreshLabel() : '';
		refreshDiv.append(
			el('label', {}, [box, el('span', { text: 'Osvježavaj svakih' })]),
			every,
			el('span', { class: 'ms-refresh-left', text: left ? `još ${left}` : '' }));
	}
	renderRefreshRow();

	// the clock is in two places, this row and the tab's countdown, so a change
	// made at the other one is read back here rather than left standing
	panel._onRefreshChange = renderRefreshRow;

	// G flips the grid from the keyboard (widgets/keyboard.js) through setGridPrefs, which
	// calls this: the row is re-read from the prefs rather than left standing on
	// the copy it took when it was built, which the next tick would write back
	panel._onGridChange = () => {
		gridChecked = isGridShown();
		snapChecked = isGridSnapped();
		renderModeRow();
	};

	// the mode is part of the layout, so a changed tick is a pending edit like
	// a changed list: the row, the line it speaks for and Ažuriraj all follow
	function setDashboardChecked(on) {
		dashboardChecked = on;
		renderModeRow();
		renderLayoutLine();
		renderManage();
	}

	// what is popped out over the page, with the way back (on the board the
	// mode row says it)
	function renderLayoutLine() {
		layoutDiv.replaceChildren();
		const parts = layoutParts();
		layoutDiv.hidden = isDashboard() || !parts.length;
		if (layoutDiv.hidden) return;
		const backLink = el('a', { text: 'Vrati sve' });
		backLink.addEventListener('click', dockAllPopouts);
		layoutDiv.append(el('span', { text: `Izdvojene karte: ${parts.join(', ')}` }), backLink);
	}
	renderLayoutLine();

	// the arrangement changes from inside the open panel — Vrati sve on the
	// layout line — and the rows and Ažuriraj follow at once. A gesture on a
	// widget cannot: it is a press outside, which the backdrop takes
	panel._onLayoutChange = () => {
		renderModeRow();
		renderLayoutLine();
		renderManage();
	};

	// ----- saved preset management -----

	const manageDiv = el('div', { class: 'ms-manage' });

	// whether the name field is open; the field itself outlives every re-render
	// so what was typed survives a row being deleted or hidden underneath it
	let addingPreset = false;

	const nameInput = el('input', {
		type: 'text', class: 'ms-name', maxlength: String(PRESET_NAME_MAX),
		placeholder: 'Naziv predloška'
	});
	const saveBtn = el('button', { type: 'button', class: 'btn', text: 'Spremi' });

	function saveCurrentAs(name) {
		const preset = storeUserPreset(name, selectedMapIds(), selectedLayout());
		nameInput.value = '';
		addingPreset = false; // the form has done its job
		editingPresetId = preset.id; // the list is now this preset's, so edits from here go back to it
		renderPresets(preset.id); // saving selects what was just saved
		renderManage();
	}

	saveBtn.addEventListener('click', () => {
		const name = cleanPresetName(nameInput.value);
		if (!name) { nameInput.focus(); return; }
		saveCurrentAs(name);
	});
	nameInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') { e.preventDefault(); saveBtn.click(); }
		else if (e.key === 'Escape') { // same way out as the rename editor
			addingPreset = false;
			nameInput.value = '';
			renderManage();
		}
	});

	// which preset is being renamed, if any; renderManage builds that one row as
	// an editor, so starting a second rename closes the first on its own
	let renamingId = null;

	// mirrors nameInput: the editor outlives renderManage, so what was typed
	// survives a re-render started from anywhere else in the panel — hiding a
	// built-in, opening the add form, deleting another row. A rebuilt input
	// would reset itself to the stored name and drop the edit in progress.
	const renameInput = el('input', {
		type: 'text', class: 'ms-name ms-rename', maxlength: String(PRESET_NAME_MAX)
	});

	// set only where the editor is opened, so those same re-renders leave the
	// focus wherever the user just put it
	let renameOpening = false;

	function startRename(preset) {
		renamingId = preset.id;
		renameInput.value = preset.name;
		renameInput.classList.remove('invalid');
		renameOpening = true;
		renderManage();
	}

	function commitRename() {
		const preset = userPresets.find(p => p.id === renamingId);
		if (!preset) return;
		const name = cleanPresetName(renameInput.value);
		const clash = findUserPresetByName(name);
		// empty, or a name another preset already holds: stay in the editor and
		// mark the field rather than silently dropping what was typed
		if (!name || (clash && clash !== preset)) {
			renameInput.classList.add('invalid');
			renameInput.focus();
			return;
		}
		preset.name = name;
		saveUserPresets();
		renamingId = null;
		renderPresets(checkedPresetId());
		renderManage();
	}

	function cancelRename() {
		renamingId = null;
		renderManage();
	}

	// bound once, on the element that outlives the re-renders
	renameInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
		else if (e.key === 'Escape') cancelRename();
	});
	renameInput.addEventListener('input', () => renameInput.classList.remove('invalid'));

	// the action slots line up as columns down the list, so a row without one
	// leaves it empty instead of shifting the rest along. Three is what fits a
	// phone row beside the name, so an action added here has to replace one
	// rather than join them — see the Ažuriraj/Podijeli swap below.
	function buildLinkCells(cells) {
		return el('span', { class: 'ms-manage-links' }, cells.map(cell => cell || el('span')));
	}

	// only the preset the list came from: any other row would take an overwrite
	// with a list that has nothing to do with it. Saving under the same name in
	// the add form still works and is unchanged — this is the same write, minus
	// having to know that the name is the handle. The saved-preset guard is not
	// redundant: editingPresetId also holds built-in ids (they carry the origin
	// dot), and a built-in reaching storeUserPreset would fork a saved copy of
	// itself under its own name rather than update anything.
	// The arrangement counts as an edit too — it is part of what the preset
	// stores — but only here: the origin dot on the chip marks a changed list,
	// which is what the panel itself edits, and a rearranged page still shows
	// the preset's maps.
	function hasPendingEdits(preset) {
		return isUserPresetId(preset.id) && preset.id === editingPresetId
			&& (!sameMapIds(preset.maps, selectedMapIds()) || !sameSnapLayout(preset.layout, selectedLayout()));
	}

	// shares the preset as saved — the panel's Podijeli button is the one that
	// carries unsaved edits to the list. Built-ins share by id, which every
	// visitor resolves; a saved preset has to carry its contents instead.
	function buildShareLink(getPrefs) {
		const link = el('a', { text: 'Podijeli' });
		link.addEventListener('click', () => {
			copyMapViewLink(getPrefs(), () => flashLabel(link, 'Kopirano!', 'Podijeli'));
		});
		return link;
	}

	function buildBuiltinRow(preset) {
		const hidden = isPresetHidden(preset.id);

		// the permanent one keeps its row but not the toggle, so it reads as an
		// option that was never on offer rather than one that failed to work
		let toggleLink = null;
		if (isHideablePreset(preset.id)) {
			toggleLink = el('a', { text: hidden ? 'Prikaži' : 'Sakrij' });
			toggleLink.addEventListener('click', () => {
				setPresetHidden(preset.id, !hidden);
				// renderPresets drops a selection that just became invisible
				renderPresets(checkedPresetId());
				renderManage();
			});
		}
		// no share link: a built-in resolves for every visitor already, so a link
		// to one carries nothing they lack — and the panel's Podijeli button
		// covers sharing whichever view is on screen. The toggle takes the last
		// slot so it ends the row where Obriši ends the ones above.
		return el('div', { class: 'ms-manage-item' + (hidden ? ' ms-hidden' : '') }, [
			el('span', { class: 'ms-manage-name', text: preset.name }),
			buildLinkCells([null, null, toggleLink])
		]);
	}

	function buildManageRow(preset) {
		if (preset.id === renamingId) return buildRenameRow();

		const renameLink = el('a', { text: 'Preimenuj' });
		const deleteLink = el('a', { text: 'Obriši' });

		// writes the list on screen over this preset, keeping its id — so saved
		// preferences and links naming it follow the change instead of breaking.
		// It saves the preset only: the page still shows the old view until
		// Primijeni, the same as every other panel action.
		//
		// It takes the share slot rather than a fourth one: four columns overflow
		// a phone row beside the name and drop every row's actions onto a second
		// line. Podijeli is the one to give up while a row has unsaved edits — it
		// shares the preset *as saved*, which is least useful exactly then, and
		// the panel's own Podijeli covers the list on screen. It comes back the
		// moment the edits are saved or dropped.
		let firstLink;
		if (hasPendingEdits(preset)) {
			firstLink = el('a', { text: 'Ažuriraj' });
			firstLink.addEventListener('click', () => {
				storeUserPreset(preset.name, selectedMapIds(), selectedLayout()); // by name, the one write path
				renderPresets(preset.id); // the list is this preset again, so its chip comes back
				renderManage();
			});
		} else {
			firstLink = buildShareLink(() => presetSharePrefs(preset));
		}

		const row = el('div', { class: 'ms-manage-item' }, [
			el('span', { class: 'ms-manage-name' + (isBoardPreset(preset) ? ' ms-board' : ''), text: preset.name, title: isBoardPreset(preset) ? 'Nadzorna ploča' : undefined }),
			buildLinkCells([firstLink, renameLink, deleteLink])
		]);

		renameLink.addEventListener('click', () => startRename(preset));

		// two-step instead of a confirm() dialog: the first click arms the link,
		// a second within a few seconds deletes, and it disarms itself otherwise
		let armed = null;
		const disarm = () => {
			clearTimeout(armed);
			armed = null;
			deleteLink.textContent = 'Obriši';
			deleteLink.classList.remove('active');
		};
		deleteLink.addEventListener('click', () => {
			if (!armed) {
				deleteLink.textContent = 'Sigurno?';
				deleteLink.classList.add('active');
				armed = setTimeout(disarm, 3000);
				return;
			}
			disarm();
			// the map list on screen is untouched — it just stops being a saved preset
			const wasSelected = checkedPresetId() === preset.id;
			if (editingPresetId === preset.id) editingPresetId = null; // nothing left to write back to
			deleteUserPreset(preset.id);
			renderPresets(wasSelected ? 'custom' : checkedPresetId());
			renderManage();
		});

		return row;
	}

	// the name is only committed on "Potvrdi" or Enter — never on leaving the
	// field, so clicking elsewhere can't rename anything behind your back
	function buildRenameRow() {
		const confirmLink = el('a', { text: 'Potvrdi' });
		const cancelLink = el('a', { text: 'Odustani' });
		confirmLink.addEventListener('click', commitRename);
		cancelLink.addEventListener('click', cancelRename);

		// Potvrdi and Odustani sit under Preimenuj and Obriši, the actions they stand in for
		return el('div', { class: 'ms-manage-item' }, [
			renameInput,
			buildLinkCells([null, confirmLink, cancelLink])
		]);
	}

	// the shared list is already one of the saved presets, so the bar has its
	// chip selected and "Spremi" would only add a second copy under a suffixed
	// name. Recomputed per render: deleting that preset brings the row back.
	function sharedAlreadySaved() {
		const ids = resolveMapIds();
		return userPresets.some(preset => sameMapIds(preset.maps, ids));
	}

	function buildSharedRow() {
		const saveLink = el('a', { text: 'Spremi' });
		saveLink.addEventListener('click', () => {
			// saves what is on screen, so any tweak the recipient made is kept
			saveCurrentAs(uniquePresetName(sharedMapView.name));
		});
		return el('div', { class: 'ms-shared' }, [
			el('span', { text: `Podijeljen predložak "${sharedMapView.name}"` }),
			saveLink
		]);
	}

	function buildBuiltinHeading() {
		const heading = el('div', { class: 'ms-manage-title', text: 'Zadani predlošci' });
		const links = el('span', { class: 'ms-manage-title-links' });

		const addLink = (text, apply) => {
			const link = el('a', { text: text });
			link.addEventListener('click', () => {
				apply();
				renderPresets(checkedPresetId());
				renderManage();
			});
			links.appendChild(link);
		};

		// each shown only while it would do something — "Sakrij sve" reaches
		// every preset but the permanent one, so that is the count to stop at
		if (hiddenPresets.length < hideablePresets().length) addLink('Sakrij sve', hideAllPresets);
		if (hiddenPresets.length) addLink('Prikaži sve', showAllPresets);

		heading.appendChild(links);
		return heading;
	}

	// the name field is only worth its space while a preset is being added, so
	// it lives behind "Dodaj" and folds away again once one is saved
	function buildUserHeading() {
		const heading = el('div', { class: 'ms-manage-title', text: 'Moji predlošci' });
		const addLink = el('a', { text: addingPreset ? 'Odustani' : 'Dodaj' });
		addLink.addEventListener('click', () => {
			addingPreset = !addingPreset;
			if (!addingPreset) nameInput.value = '';
			renderManage();
			// nameInput outlives the re-render, so this reaches the live field
			if (addingPreset) nameInput.focus();
		});
		heading.appendChild(el('span', { class: 'ms-manage-title-links' }, [addLink]));
		return heading;
	}

	function renderManage() {
		manageDiv.replaceChildren();

		// the built-ins are listed too, so a hidden one can be brought back
		// individually and not only through "Prikaži sve". They lead here the way
		// they lead the preset bar, where the saved ones follow them as well
		manageDiv.appendChild(buildBuiltinHeading());
		MAP_PRESETS.forEach(preset => manageDiv.appendChild(buildBuiltinRow(preset)));

		manageDiv.appendChild(buildUserHeading());
		if (addingPreset) manageDiv.appendChild(el('div', { class: 'ms-save' }, [nameInput, saveBtn]));
		if (sharedMapView && sharedMapView.name && !sharedAlreadySaved()) manageDiv.appendChild(buildSharedRow());
		if (userPresets.length) {
			userPresets.forEach(preset => manageDiv.appendChild(buildManageRow(preset)));
		} else {
			manageDiv.appendChild(el('div', { class: 'ms-manage-empty', text: 'Nema spremljenih predložaka' }));
		}

		// only where the rename was just opened — every other re-render leaves
		// the focus alone, including the ones that happen with an editor open
		if (renameOpening) {
			renameOpening = false;
			renameInput.focus();
			renameInput.select();
		}
	}

	renderManage();

	const applyBtn = el('button', { type: 'button', class: 'btn ms-apply', text: 'Primijeni', title: 'Primijeni (Enter)' });
	applyBtn.addEventListener('click', () => {
		const prefs = readPanelPrefs();
		const layout = layoutForPrefs(prefs);
		if (layout) prefs.layout = layout;
		saveMapPrefs(prefs);
		clearSharedMapView(); // the saved preferences take over from the shared link
		setMapSettingsVisible(panel, false);
		renderMaps();
		initDynamicContent();
		applySnapLayout(layout); // the render dropped the panes; these are the ones to come back
	});

	// a link, like the per-preset Podijeli it does the same job as; the filled
	// button is kept for Primijeni, the one action that changes the page
	const shareLink = el('a', { text: 'Podijeli' });
	shareLink.addEventListener('click', () => {
		copyMapViewLink(readSharePrefs(), () => flashLabel(shareLink, 'Kopirano!', 'Podijeli'));
	});

	const closeLink = el('a', { text: 'Zatvori', title: 'Zatvori (Esc)' });
	closeLink.addEventListener('click', () => setMapSettingsVisible(panel, false));

	// the header stays put and the body under it scrolls (CSS); in the body
	// the actions sit right under the render order they act on, rather than
	// at the far end of the picker and the preset management below it
	// and before the title the way home, which the board and the hidden page
	// take out of sight. Resolved off this page's own address rather than
	// written as /, since the built site lives under /meteo/, and a real href,
	// so Ctrl and the middle button open it beside the page as any link does.
	// It shows the site's favicon, taken off the page's own <link> so the
	// address is whatever the build made it
	const icon = document.querySelector('link[rel="icon"][sizes="32x32"]');
	const homeLink = el('a', { class: 'ms-home', href: new URL('../', window.location.href).href, title: 'Početna' }, [
		el('img', { src: icon ? icon.href : undefined, alt: 'Početna' })
	]);
	panel.appendChild(el('div', { class: 'ms-head' }, [
		el('span', { class: 'ms-head-left' }, [homeLink, el('span', { class: 'ms-title', text: 'Karte' })]),
		closeLink
	]));
	panel.appendChild(el('div', { class: 'ms-body' }, [
		presetsDiv,
		modeDiv,
		refreshDiv,
		layoutDiv,
		selectedDiv,
		el('div', { class: 'ms-actions' }, [applyBtn, shareLink]),
		sortDiv,
		findDiv,
		availableDiv,
		manageDiv
	]));

	// the window handles again: replaceChildren above took the last set with it
	buildDialogHandles(panel);
}
