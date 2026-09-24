// The settings dialog (Karte): presets, the pick and order of maps, the
// board's mode and grid, auto-refresh, saved presets and share links.
// Nothing is applied until Primijeni, except the grid and refresh switches.

import { el, flashLabel, query } from '../lib/dom.js';
import { EVENTS, on } from '../lib/events.js';
import { activePresetId, clearSharedMapView, resolveMapIds, saveMapPrefs } from '../maps/prefs.js';
import { isBoardPreset } from '../maps/presets.js';
import { renderMaps } from '../maps/view.js';
import { copyMapViewLink } from '../maps/share.js';
import { registerCommand, withKey } from '../page/commands.js';
import { initDynamicContent } from '../page/content.js';
import { buildDialogHandles, setDialogVisible } from '../page/dialog.js';
import { isGridShown, isGridSnapped } from '../widgets/grid.js';
import { applySnapLayout, isDashboardView } from '../widgets/layout.js';
import { createMapList } from './panel-list.js';
import { createPresetManager } from './panel-manage.js';
import { createPresetBar } from './panel-presets.js';
import { createLayoutLine, createModeRow, createRefreshRow } from './panel-rows.js';
import { layoutForPrefs, readPanelPrefs, readSharePrefs, selectedLayout } from './panel-view.js';

// opening and shutting — the lock, the gutter, the backdrop, the stored
// geometry — is the chrome both dialogs share (page/dialog.js). The arrow on
// the page's Karte button is not set here but off the dialog-toggled event,
// so a shut this function never made (the backdrop, Escape, the manual
// opening over it) moves it just the same
export function toggleMapSettings() {
	const element = document.getElementById('mapSettings');
	if (!element) return;
	if (element.hidden) buildMapSettings(element); // rebuilt from what is stored, so a dismissal drops the edits
	setDialogVisible(element, element.hidden);
}

// the hooks of the dialog built last; it is rebuilt on every open, so the
// page's events are subscribed to once and handed to whichever is up
let openPanel = null;

function whileOpen(hook) {
	return () => {
		const element = document.getElementById('mapSettings');
		if (openPanel && element && !element.hidden) openPanel[hook]();
	};
}

export function initMapSettings() {
	on(EVENTS.gridChanged, whileOpen('gridChanged'));
	on(EVENTS.refreshChanged, whileOpen('refreshChanged'));
	on(EVENTS.refreshTick, whileOpen('refreshTick'));
	on(EVENTS.layoutChanged, whileOpen('layoutChanged'));

	// the picker from the keyboard, for wherever the page's button is out of
	// reach; the button and the tab run the same command. Escape is the shared
	// chrome's, since it shuts whichever dialog is up
	registerCommand('map-settings', { keys: ['k', 'K'], run: () => toggleMapSettings() });

	// Enter is Primijeni while the picker is up, wherever the focus is in it — a
	// chip, a checkbox, a button just pressed. Kept from the focused button,
	// which would otherwise take it as its own click: a press on Nadzorna ploča
	// followed by Enter would tick the mode back off instead of applying it
	// (Space still presses a button). A text field keeps its own Enter (the
	// preset name editors), and so does the interval list
	registerCommand('settings-apply', {
		keys: ['Enter'],
		capture: true,
		keyWhen: (e) => {
			const element = document.getElementById('mapSettings');
			return !e.shiftKey && !e.isComposing && !!element && !element.hidden
				&& !(e.target.matches && e.target.matches('select')) && !!element.querySelector('.ms-apply');
		},
		run: () => query('#mapSettings .ms-apply').click()
	});

	// the page's Karte button wears the picker's state as an arrow
	on(EVENTS.dialogToggled, ({ panel, visible }) => {
		if (panel.id !== 'mapSettings') return;
		const arrow = document.querySelector('.buttons button.btn .arrow');
		if (arrow) arrow.textContent = visible ? '▲' : '▼';
	});
}

// The dialog is built afresh on every open, from what is stored, so a
// dismissal drops the edits. Its sections — the preset bar, the rows, the two
// lists, the preset management — do not call one another: what one changes
// that another shows goes through the panel object below, which holds what
// the dialog is editing (a Mediator)
function buildMapSettings(element) {
	element.replaceChildren();

	const panel = {
		element,

		// which preset the list in the picker came from, built-in or saved. Editing
		// it flips the bar to "Prilagođeno" (see listEdited), so the selection can no
		// longer say where the list started: this is what the dot on the origin chip
		// and the "Ažuriraj" link on the saved row both hang off. Null whenever the
		// list is nobody's — a stored custom view, or a shared one matching nothing.
		editingPresetId: activePresetId() === 'custom' ? null : activePresetId(),

		// the board is a mode of the view the panel edits, not a place it sends you:
		// the mode row's button only ticks this, and Primijeni builds the view from
		// it along with the list (layoutForPrefs). Starts at what is on screen, so
		// opening the panel and applying anything unchanged changes nothing.
		dashboardChecked: isDashboardView(),

		// the board's grid. Unlike the mode beside them these take effect at once —
		// they are a way of working, not a view to be applied — and they are the
		// browser's rather than the view's (widgets/grid.js stores them), so they
		// start at what is set and keep it whether or not the board is on
		gridChecked: isGridShown(),
		snapChecked: isGridSnapped(),

		selectedMapIds: () => list.selectedIds(),
		checkedPresetId: () => presets.checkedId(),
		selectedLayout: () => selectedLayout(list.selectedIds(), panel.dashboardChecked),

		// a tick, an untick or a drag in the list: it is a custom list now, and the
		// edit may have just put it out of step with the preset it came from, or
		// brought it back into step, which is what the dot and Ažuriraj hang off
		listEdited() {
			presets.markCustom();
			manage.render();
		},

		// switching to a named preset previews its whole view: its list and its
		// mode, since a preset saved as a board is a board and a built-in, carrying
		// no layout, is the page. "Prilagođeno" keeps both as they are, and picking
		// it by hand detaches the list from wherever it came from: no dot, and no
		// row offering to take the edits back
		presetChosen(preset, mapIds) {
			if (preset.id !== 'custom') {
				list.fill(mapIds);
				panel.setDashboardChecked(isBoardPreset(preset));
			}
			panel.editingPresetId = preset.id === 'custom' ? null : preset.id;
			presets.updateOriginMark();
			manage.render();
		},

		// a preset saved, renamed, deleted, hidden or shown: the bar and the
		// management list are both drawn again, the bar with this selected
		presetsChanged(selectedId) {
			presets.render(selectedId);
			manage.render();
		},

		// the mode is part of the layout, so a changed tick is a pending edit like
		// a changed list: the row, the line it speaks for and Ažuriraj all follow
		setDashboardChecked(on) {
			panel.dashboardChecked = on;
			mode.render();
			layoutLine.render();
			manage.render();
		},

		close() {
			setDialogVisible(element, false);
		}
	};

	const list = createMapList(panel);
	const presets = createPresetBar(panel);
	const mode = createModeRow(panel);
	const refresh = createRefreshRow();
	const layoutLine = createLayoutLine();
	const manage = createPresetManager(panel);

	// the list first: the bar reads it back to decide where the dot goes, and an
	// empty picker would read as "edited away from the origin"
	list.fill(resolveMapIds());
	presets.render(activePresetId());
	mode.render();
	refresh.render();
	layoutLine.render();
	manage.render();

	// what the page announces while this dialog is the one open (see
	// initMapSettings, which subscribes once for every dialog built)
	openPanel = {
		// the clock is in two places, the refresh row and the tab's countdown,
		// so a change made at the other one is read back here rather than left
		// standing
		refreshChanged: () => refresh.render(),
		refreshTick: () => refresh.tick(),

		// G flips the grid from the keyboard (widgets/keyboard.js): the row is
		// re-read from the prefs rather than left standing on the copy it took
		// when it was built, which the next tick would write back
		gridChanged() {
			panel.gridChecked = isGridShown();
			panel.snapChecked = isGridSnapped();
			mode.render();
		},

		// the arrangement changes from inside the open panel — Vrati sve on the
		// layout line — and the rows and Ažuriraj follow at once. A gesture on a
		// widget cannot: it is a press outside, which the backdrop takes
		layoutChanged() {
			mode.render();
			layoutLine.render();
			manage.render();
		}
	};

	const applyBtn = el('button', { type: 'button', class: 'btn ms-apply', text: 'Primijeni', title: withKey('Primijeni', 'settings-apply') });
	applyBtn.addEventListener('click', () => {
		const prefs = readPanelPrefs(presets.checkedId(), list.selectedIds());
		const layout = layoutForPrefs(prefs, panel.dashboardChecked);
		if (layout) prefs.layout = layout;
		saveMapPrefs(prefs);
		clearSharedMapView(); // the saved preferences take over from the shared link
		panel.close();
		renderMaps();
		initDynamicContent();
		applySnapLayout(layout); // the render dropped the panes; these are the ones to come back
	});

	// a link, like the per-preset Podijeli it does the same job as; the filled
	// button is kept for Primijeni, the one action that changes the page
	const shareLink = el('a', { text: 'Podijeli' });
	shareLink.addEventListener('click', () => {
		const prefs = readSharePrefs(readPanelPrefs(presets.checkedId(), list.selectedIds()), panel.dashboardChecked);
		copyMapViewLink(prefs, () => flashLabel(shareLink, 'Kopirano!', 'Podijeli'));
	});

	const closeLink = el('a', { text: 'Zatvori', title: withKey('Zatvori', 'dialog-close') });
	closeLink.addEventListener('click', () => panel.close());

	// the way home, before the title, since the board and a hidden page take
	// the page's own link out of sight. A real href (Ctrl and the middle button
	// work), resolved off this page's address because the built site lives
	// under /meteo/; the icon is the page's own favicon, wherever the build put it
	const icon = /** @type {HTMLLinkElement | null} */ (document.querySelector('link[rel="icon"][sizes="32x32"]'));
	const homeLink = el('a', { class: 'ms-home', href: new URL('../', window.location.href).href, title: 'Početna' }, [
		el('img', { src: icon ? icon.href : undefined, alt: 'Početna' })
	]);
	element.appendChild(el('div', { class: 'ms-head' }, [
		el('span', { class: 'ms-head-left' }, [homeLink, el('span', { class: 'ms-title', text: 'Karte' })]),
		closeLink
	]));
	// the header stays put and the body scrolls (CSS); in the body the actions
	// sit right under the render order they act on
	element.appendChild(el('div', { class: 'ms-body' }, [
		presets.element,
		mode.element,
		refresh.element,
		layoutLine.element,
		list.selected,
		el('div', { class: 'ms-actions' }, [applyBtn, shareLink]),
		list.sort,
		list.find,
		list.available,
		manage.element
	]));

	// the window handles again: replaceChildren above took the last set with it
	buildDialogHandles(element);
}
