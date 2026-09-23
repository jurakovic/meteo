// The settings dialog's preset management: the built-ins (hidden or shown) and
// the saved presets (saved, updated, renamed, shared, deleted), with the row
// for saving a preset that arrived in a shared link.
import { el, flashLabel } from '../lib/dom.js';
import { resolveMapIds, sameMapIds, sharedMapView } from '../maps/prefs.js';
import { cleanPresetName, deleteUserPreset, findUserPresetByName, hiddenPresets, hideablePresets, hideAllPresets, isBoardPreset, isHideablePreset, isPresetHidden, MAP_PRESETS, PRESET_NAME_MAX, saveUserPresets, setPresetHidden, showAllPresets, storeUserPreset, uniquePresetName, userPresets } from '../maps/presets.js';
import { copyMapViewLink, presetSharePrefs } from '../maps/share.js';
import { hasPendingEdits } from './panel-view.js';

// panel is the dialog (settings/panel.js): it holds the list and
// editingPresetId, and redraws the preset bar and this section together
// (presetsChanged)
export function createPresetManager(panel) {
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
		const preset = storeUserPreset(name, panel.selectedMapIds(), panel.selectedLayout());
		nameInput.value = '';
		addingPreset = false; // the form has done its job
		panel.editingPresetId = preset.id; // the list is now this preset's, so edits from here go back to it
		panel.presetsChanged(preset.id); // saving selects what was just saved
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
			render();
		}
	});

	// which preset is being renamed, if any; render builds that one row as an
	// editor, so starting a second rename closes the first on its own
	let renamingId = null;

	// mirrors nameInput: the editor outlives render, so what was typed
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
		render();
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
		panel.presetsChanged(panel.checkedPresetId());
	}

	function cancelRename() {
		renamingId = null;
		render();
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
				// the bar drops a selection that just became invisible
				panel.presetsChanged(panel.checkedPresetId());
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
		if (hasPendingEdits(preset, panel.editingPresetId, panel.selectedMapIds(), panel.selectedLayout())) {
			firstLink = el('a', { text: 'Ažuriraj' });
			firstLink.addEventListener('click', () => {
				storeUserPreset(preset.name, panel.selectedMapIds(), panel.selectedLayout()); // by name, the one write path
				panel.presetsChanged(preset.id); // the list is this preset again, so its chip comes back
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
			const wasSelected = panel.checkedPresetId() === preset.id;
			if (panel.editingPresetId === preset.id) panel.editingPresetId = null; // nothing left to write back to
			deleteUserPreset(preset.id);
			panel.presetsChanged(wasSelected ? 'custom' : panel.checkedPresetId());
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
				panel.presetsChanged(panel.checkedPresetId());
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
			render();
			// nameInput outlives the re-render, so this reaches the live field
			if (addingPreset) nameInput.focus();
		});
		heading.appendChild(el('span', { class: 'ms-manage-title-links' }, [addLink]));
		return heading;
	}

	function render() {
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

	return { element: manageDiv, render };
}
