// The one breakpoint. Above it, with a mouse, the page is a desktop: widgets,
// the board, resizable dialogs. At or below it (or on touch) it is a phone:
// one column of maps and dialogs over the whole screen. styles.css carries the
// same numbers in its media queries.

export const DESKTOP_MQ = window.matchMedia('(min-width: 801px) and (hover: hover) and (pointer: fine)');

// narrow by width alone, touch or not: the interactive maps load at their
// mobile zoom and the gate's hint speaks of a tap
export function isNarrowViewport() {
	return window.innerWidth < 800;
}
