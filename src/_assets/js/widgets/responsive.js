// Widgets following the window and their own content: held inside a smaller
// window, and refitted when an image loads or a slide changes.

import { isSnapped, layoutSnapColumns } from './columns.js';
import { floatingBlocks, placePopout } from './core.js';
import { groupBox, groupMembers, groupStarts, moveGroup, updateGroups } from './groups.js';
import { refreshOverlap, syncShadows } from './overlap.js';
import { fitWidget, syncBackdrop } from './popout.js';

// debounced: the window is resized a pixel at a time
let resizeTimer = 0;

export function initWidgetResponsiveness() {
	// a smaller window must not strand a widget off-screen
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
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
			refreshOverlap(); // the clamp may have moved a widget onto or off another
		}, 200);
	});

	// fitted again after a load, a click or a pointerup in a widget: a titled
	// slideshow's height is right once its image has loaded, it changes aspect
	// with the slide (arrows and swipe end in a click or a pointerup), and the
	// same events bring a slide's title bar on screen
	['load', 'click', 'pointerup'].forEach(type => {
		document.addEventListener(type, (e) => {
			const target = /** @type {Element} */ (e.target);
			const block = target.closest && /** @type {HTMLElement | null} */ (target.closest('.map-block.popout'));
			if (!block) return;
			setTimeout(() => {
				if (isSnapped(block) && !block.classList.contains('free')) layoutSnapColumns();
				fitWidget(block);
				syncBackdrop(block); // the image on screen may be another
				syncShadows(); // a floating locked widget's height changed with it, and its shadow is its size
			}, 0);
		}, true);
	});
}
