// The settings dialog's preset bar: a chip per preset on offer, built-in and
// saved, and "Prilagođeno" for a list that is nobody's.

import { el } from '../lib/dom.js';
import { presetMapIds, sameMapIds } from '../maps/prefs.js';
import { allPresets, isBoardPreset, isUserPresetId, visiblePresets } from '../maps/presets.js';

// panel is the dialog (settings/panel.js): it holds editingPresetId and the
// list, and hears of a preset picked (presetChosen)
export function createPresetBar(panel) {
	const presetsDiv = el('div', { class: 'ms-presets' });

	// The dot marks the preset the list on screen started from, once it no longer
	// matches it. "Prilagođeno" keeps the selection — what travels in a share link
	// is a bare list, and a chip left looking selected would promise a name the
	// payload cannot carry — so the dot says which named view the edits are a copy
	// of without claiming to be it. Clicking that chip reloads the preset and
	// drops the edits, which the radio already does: it is the unchecked one.
	function updateOriginMark() {
		presetsDiv.querySelectorAll('.ms-origin').forEach(chip => chip.classList.remove('ms-origin'));
		const preset = allPresets().find(p => p.id === panel.editingPresetId);
		// a hidden preset has no chip to mark, hence the guard on the radio
		if (!preset || sameMapIds(preset.maps, panel.selectedMapIds())) return;
		// compared rather than built into a selector: ids come from localStorage,
		// where a hand-edited one could carry a quote and throw on querySelector
		const radio = [...presetsDiv.querySelectorAll('input')].find(input => input.value === panel.editingPresetId);
		if (radio) radio.nextElementSibling.classList.add('ms-origin');
	}

	return {
		element: presetsDiv,

		// rebuilt whenever the saved presets change, so they sit among the
		// built-ins and stay selectable the same way
		render(selectedId) {
			presetsDiv.replaceChildren();
			const options = [...visiblePresets(), { id: 'custom', name: 'Prilagođeno' }];
			// a hidden preset has no radio to check, and the maps on screen are still
			// its own, so the selection becomes custom rather than silently reverting
			if (!options.some(preset => preset.id === selectedId)) selectedId = 'custom';
			options.forEach(preset => {
				const radio = el('input', { type: 'radio', name: 'msPreset', value: preset.id });
				radio.checked = preset.id === selectedId;
				radio.addEventListener('change', () => panel.presetChosen(preset, presetMapIds(preset.id)));
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
		},

		updateOriginMark,

		// an edit of the list makes it nobody's; the dot then says whose it was
		markCustom() {
			presetsDiv.querySelector('input[name="msPreset"][value="custom"]').checked = true;
			updateOriginMark();
		},

		checkedId() {
			const checked = presetsDiv.querySelector('input[name="msPreset"]:checked');
			return checked ? checked.value : 'zadano';
		}
	};
}
