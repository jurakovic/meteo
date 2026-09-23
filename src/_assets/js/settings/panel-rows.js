// The settings dialog's rows above the list: the board's mode with its grid
// switches, the auto-refresh clock, and the line naming what is popped out.
import { el } from '../lib/dom.js';
import { DESKTOP_MQ } from '../lib/media.js';
import { arrangeBoard } from '../widgets/arrange.js';
import { isDashboard } from '../widgets/board.js';
import { setGridPrefs } from '../widgets/grid.js';
import { currentSnapLayout } from '../widgets/layout.js';
import { dockAllPopouts } from '../widgets/popout.js';
import { isRefreshOn, REFRESH_CHOICES, refreshEveryMinutes, refreshLabel, setRefreshPrefs } from '../widgets/refresh.js';
import { layoutParts } from './panel-view.js';

// the board is another way of viewing altogether, so it gets a row of its
// own with a button, not a link among the others — a toggle, though, not a
// way onto it: it ticks dashboardChecked and nothing moves until Primijeni,
// like the ticks in the list beside it. Whether it is ticked is the lit
// band's (.ms-on) to say, and what is on screen the layout line's, so the
// row never narrates. Beside it the board's two grid switches, which only
// mean anything on it: greyed and unclickable while it is off, their state
// kept all the same, since they are a way of working rather than a view.
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
			tile.disabled = !panel.dashboardChecked || !isDashboard();
			tile.addEventListener('click', () => arrangeBoard());
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
