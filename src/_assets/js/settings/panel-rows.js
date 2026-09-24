// The settings dialog's rows above the list: the board's mode with its grid
// switches, the auto-refresh clock, and the line naming what is popped out.

import { el } from '../lib/dom.js';
import { DESKTOP_MQ } from '../lib/media.js';
import { withKey } from '../page/commands.js';
import { isDashboard } from '../widgets/board.js';
import { setGridPrefs } from '../widgets/grid.js';
import { currentSnapLayout } from '../widgets/layout.js';
import { dockAllPopouts } from '../widgets/popout.js';
import { isRefreshOn, REFRESH_CHOICES, refreshEveryMinutes, refreshLabel, setRefreshPrefs } from '../widgets/refresh.js';
import { layoutParts } from './panel-view.js';

// The board's row: its button is a toggle like the list's ticks, so nothing
// moves until Primijeni, and the lit band (.ms-on) says whether it is ticked.
// Beside it the grid switches and Posloži, which only mean anything on a
// board: greyed while it is unticked, their state kept.
// panel is the dialog (settings/panel.js), holding the ticks
export function createModeRow(panel) {
	const modeDiv = el('div', { class: 'ms-mode' });

	function buildGridToggle(label, checked, onChange) {
		const box = el('input', { type: 'checkbox' });
		box.checked = checked;
		box.disabled = !panel.dashboardChecked;
		box.addEventListener('change', () => onChange(box.checked));
		return el('label', { class: 'ms-grid' + (panel.dashboardChecked ? '' : ' ms-off') }, [box, el('span', { text: label })]);
	}

	return {
		element: modeDiv,

		render() {
			modeDiv.replaceChildren();
			modeDiv.hidden = !DESKTOP_MQ.matches; // the widgets and the board are a desktop thing
			modeDiv.classList.toggle('ms-on', panel.dashboardChecked);
			const btn = el('button', { type: 'button', class: 'btn', 'aria-pressed': String(panel.dashboardChecked) }, [
				document.createTextNode('Nadzorna ploča '),
				el('span', { class: 'beta', text: 'beta' })
			]);
			btn.addEventListener('click', () => panel.setDashboardChecked(!panel.dashboardChecked));
			// Posloži arranges the board that is up, so it needs both a board and
			// the tick: ticked but not yet applied there is nothing to arrange
			const tile = el('button', { type: 'button', class: 'btn ms-arrange', 'data-action': 'arrange', title: withKey('Posloži u mrežu', 'arrange') }, [
				document.createTextNode('Posloži')
			]);
			tile.disabled = !panel.dashboardChecked || !isDashboard();
			// the grid switches act on the tick, not on Primijeni: they are a way
			// of working on the board rather than part of the view
			modeDiv.append(btn,
				buildGridToggle('Prikaži mrežu', panel.gridChecked, (on) => { panel.gridChecked = on; setGridPrefs(panel.gridChecked, panel.snapChecked); }),
				buildGridToggle('Poravnaj uz mrežu', panel.snapChecked, (on) => { panel.snapChecked = on; setGridPrefs(panel.gridChecked, panel.snapChecked); }),
				tile);
		}
	};
}

// the clock. Its own row and not the mode row above: that one is the board's
// and stands down on a phone, where a page left open goes just as stale
export function createRefreshRow() {
	const refreshDiv = el('div', { class: 'ms-refresh' });

	return {
		element: refreshDiv,

		render() {
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
		},

		// a second gone by: the countdown, the rest of the row as it was
		tick() {
			const label = refreshDiv.querySelector('.ms-refresh-left');
			const left = isRefreshOn() ? refreshLabel() : '';
			if (label) label.textContent = left ? `još ${left}` : '';
		}
	};
}

// what is snapped, and a way to put it all back; shown only while there is
// something to say. The line is the panel's only sign that the arrangement
// is part of the view a preset saves and a link carries. On the board the
// mode row says it instead
export function createLayoutLine() {
	const layoutDiv = el('div', { class: 'ms-layout' });

	return {
		element: layoutDiv,

		render() {
			layoutDiv.replaceChildren();
			const parts = layoutParts(currentSnapLayout());
			layoutDiv.hidden = isDashboard() || !parts.length;
			if (layoutDiv.hidden) return;
			const backLink = el('a', { text: 'Vrati sve' });
			backLink.addEventListener('click', dockAllPopouts);
			layoutDiv.append(el('span', { text: `Izdvojene karte: ${parts.join(', ')}` }), backLink);
		}
	};
}
