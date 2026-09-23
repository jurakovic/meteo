// The settings dialog's two lists of maps: the selected ones, in the order the
// page shows them (reordered by dragging), and the available ones below, a
// finding surface sorted and filtered freely.

import { el } from '../lib/dom.js';
import { catalogMap, CATEGORY_GLYPHS, MAP_CATALOG } from '../maps/catalog.js';
import { findTerms, matchesFind } from '../maps/find.js';
import { isMapEnabled } from '../remote-config.js';

// the list section of the dialog; panel is the dialog (settings/panel.js),
// told of every edit (listEdited) and asked to close from the find box
export function createMapList(panel) {
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
			panel.close();
		}
	});

	findClear.addEventListener('click', () => {
		findInput.value = '';
		applyFind();
		findInput.focus();
	});

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
				if (row.nextElementSibling !== startNext) panel.listEdited();
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
		// rows (selectedIds) still holds it where it was
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
			panel.listEdited();
		});
		enableDragReorder(handle, row);
		return row;
	}

	return {
		selected: selectedDiv,
		available: availableDiv,
		sort: sortDiv,
		find: findDiv,

		// the rows built afresh for a list of selected ids
		fill(selectedIds) {
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
		},

		// the selected block holds exactly the checked rows, in render order
		selectedIds() {
			return [...selectedDiv.children].map(row => row.getAttribute('data-map-id'));
		}
	};
}
