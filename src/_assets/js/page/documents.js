// The documents shown in a dialog on both pages, the manual and the changelog:
// built in at build time, each with a link, a key and an address of its own.
// See INTERNALS.md, Documents on the site.

import { FEATURES } from '../features.js';
import { EVENTS, on } from '../lib/events.js';
import { registerCommand } from './commands.js';
import { setDialogVisible, toggleDialog } from './dialog.js';

/**
 * @typedef {object} SiteDocument
 * @property {'manual' | 'changelog'} feature its switch in FEATURES, and the
 *   command its links and key run
 * @property {string} dialogId
 * @property {string} hash its address, without the #
 * @property {string[]} keys
 */

/** @type {SiteDocument[]} */
const DOCUMENTS = [
	// H for help: the letters name the thing, as R, G and S do, and ? would
	// need Shift on one layout and AltGr on the next
	{ feature: 'manual', dialogId: 'manualDialog', hash: 'upute', keys: ['h', 'H'] },
	// C for changelog
	{ feature: 'changelog', dialogId: 'changelogDialog', hash: 'promjene', keys: ['c', 'C'] }
];

// a document switched off (features.js) has its entries hidden by the class
// no-<feature>, and its key and address left alone. The class goes on before
// the first paint, as board-boot does, so nothing flashes up and away
export function applyDocumentSwitches() {
	DOCUMENTS.forEach(({ feature }) => {
		if (!FEATURES[feature]) document.documentElement.classList.add(`no-${feature}`);
	});
}

// a hash as text, without its #. A malformed escape (#%E0) is read as it
// stands rather than thrown on: it is no document's, and a throw here would
// take the rest of initDialogs down with it
function hashText(hash) {
	try {
		return decodeURIComponent(hash.slice(1));
	} catch {
		return hash.slice(1);
	}
}

// replaceState rather than the hash itself: assigning to location.hash stacks
// an entry for every open, so Back would walk out through them one at a time
function syncHash(hash, open) {
	const url = new URL(window.location.href);
	const already = hashText(url.hash) === hash;
	if (open === already) return;
	url.hash = open ? hash : '';
	history.replaceState(null, '', open ? url.href : url.href.replace(/#$/, ''));
}

// a heading link inside a document scrolls the dialog's own body. scrollIntoView
// scrolls every ancestor, so it would drag the page behind the dialog along with
// it — the offset between the two rects is what the body has to travel
function scrollDocumentTo(panel, id) {
	const body = panel.querySelector('.dialog-body');
	const target = panel.querySelector(`[id="${CSS.escape(id)}"]`);
	if (!body || !target) return;
	body.scrollTop += target.getBoundingClientRect().top - body.getBoundingClientRect().top;
}

/** @param {SiteDocument} doc */
function initDocument({ feature, dialogId, hash, keys }) {
	const panel = document.getElementById(dialogId);
	if (!panel || !FEATURES[feature]) return;

	const close = panel.querySelector('.dialog-close');
	if (close) close.addEventListener('click', () => setDialogVisible(panel, false));

	panel.addEventListener('click', (e) => {
		const link = /** @type {Element} */ (e.target).closest('a[href^="#"]');
		if (!link || !panel.contains(link)) return;
		e.preventDefault();
		scrollDocumentTo(panel, hashText(link.getAttribute('href')));
	});

	on(EVENTS.dialogToggled, ({ panel: toggled, visible }) => {
		if (toggled !== panel) return;
		syncHash(hash, visible);
		if (visible) panel.querySelector('.dialog-body').scrollTop = 0;
	});

	registerCommand(feature, { keys, run: () => toggleDialog(panel) });

	// the address, on arrival and whenever it is edited afterwards
	const fromHash = () => {
		const wanted = hashText(window.location.hash) === hash;
		if (wanted !== !panel.hidden) setDialogVisible(panel, wanted);
	};
	window.addEventListener('hashchange', fromHash);
	fromHash();
}

export function initDocuments() {
	DOCUMENTS.forEach(initDocument);
}
