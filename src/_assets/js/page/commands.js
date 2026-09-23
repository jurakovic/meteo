// The page's commands: everything a control or a key can do, registered once
// by id with what runs it, the keys that do (if any) and when it is on offer.
// A control declares the command it runs in the markup — data-action="id" on a
// button, a link, a checkbox or a tab glyph — and one click listener runs it;
// one keydown listener runs the commands keys are bound to. So no handler has
// to be a global for an onclick to reach, a key and the glyph that shows it
// cannot drift apart, and a title names the key the registry binds (withKey).
//
// Keys are the page's only while the focus is: not in a text field, whose own
// keys (Escape out of it, Enter to commit, letters to type) come first, and
// not under Alt, Ctrl or Meta, which belong to the browser. None reach the
// page while an iframe holds the focus: a press inside a frame belongs to the
// frame's document, and the maps are another origin.

import { isTextField } from '../lib/dom.js';
import { anyDialogOpen, closeOpenDialog } from './dialog.js';
import { exitAnyFullscreen, switchIframeZoom, toggleFullscreen } from './iframe.js';
import { scrollToElement, scrollToTop, toggleLinksBottom } from './links.js';
import { plusSlides } from './slideshow.js';

const commands = new Map();
const bound = []; // the commands keys run, in the order they were registered

// id: what data-action names. run(control, event) — control is the element
// clicked, or null from a key. keys: e.key values that run it; keyWhen(event):
// whether a key may run it now (the first bound command whose keyWhen holds
// takes the key). keepDefault: the key's own default action still happens;
// capture: the key is kept from every listener after this one
export function registerCommand(id, { run, keys = [], keyWhen = () => true, keepDefault = false, capture = false }) {
	const command = { id, run, keys, keyWhen, keepDefault, capture };
	commands.set(id, command);
	if (keys.length) bound.push(command);
}

// a control's title with the key its command is bound to: "Karte (K)"
export function withKey(label, id) {
	const command = commands.get(id);
	const key = command && command.keys[0];
	if (!key) return label;
	return `${label} (${key.length === 1 ? key.toUpperCase() : key === 'Escape' ? 'Esc' : key})`;
}

export function runCommand(id, control = null, event = null) {
	const command = commands.get(id);
	if (command) command.run(control, event);
}

// the commands every page has
export function initCommands() {
	registerCommand('top', { run: () => scrollToTop() });
	registerCommand('links', { run: () => scrollToElement('links') });
	registerCommand('links-bottom', { run: (checkbox) => toggleLinksBottom(checkbox) });
	registerCommand('slide', { run: (arrow) => plusSlides(arrow.closest('.slideshow'), Number(arrow.dataset.step)) });
	registerCommand('zoom', { run: (btn) => switchIframeZoom(btn.dataset.frame, btn) });
	registerCommand('fullscreen', { run: (btn) => toggleFullscreen(btn.dataset.frame, btn) });
	// Escape: the dialog owns it while one is open; under it Escape ends a
	// fullscreen map — a class, not the browser's own fullscreen, so nothing
	// else takes Escape off it — and under that it does nothing: backing out
	// is not a reason to take an arrangement apart
	registerCommand('dialog-close', { keys: ['Escape'], keyWhen: () => anyDialogOpen(), keepDefault: true, run: () => closeOpenDialog() });
	registerCommand('fullscreen-exit', { keys: ['Escape'], keyWhen: () => !anyDialogOpen(), keepDefault: true, run: () => exitAnyFullscreen() });

	document.addEventListener('click', (e) => {
		const control = e.target.closest && e.target.closest('[data-action]');
		if (control) runCommand(control.dataset.action, control, e);
	});
	// captured, ahead of every listener on the page, so a command that keeps
	// its key (Enter on the dialog) keeps it from the focused control too
	document.addEventListener('keydown', (e) => {
		if (e.altKey || e.ctrlKey || e.metaKey || isTextField(e.target)) return;
		const command = bound.find(c => c.keys.includes(e.key) && c.keyWhen(e));
		if (!command) return;
		if (!command.keepDefault) e.preventDefault();
		if (command.capture) e.stopPropagation();
		command.run(null, e);
	}, true);
}
