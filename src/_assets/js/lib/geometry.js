// Numbers and the viewport they are measured in.

/** @param {number} value @param {number} min @param {number} max @returns {number} */
export function clamp(value, min, max) {
	return Math.min(Math.max(value, min), Math.max(min, max));
}

// a fraction as stored: four decimals, a tenth of a pixel on a 1000px screen
/** @param {number} n @returns {number} */
export function roundFraction(n) {
	return Math.round(n * 10000) / 10000;
}

// a position as written: thousandths of a pixel, the layout unit being 1/64px.
// Whole pixels would cost the magnets their landing (see moveGroup)
/** @param {number} v @returns {number} */
export function subpixel(v) {
	return Math.round(v * 1000) / 1000;
}

// the scrollbar's width while a dialog holds its place (page/dialog.js), 0
// otherwise
let scrollbarGutter = 0;

/** @param {number} px */
export function setScrollbarGutter(px) {
	scrollbarGutter = px;
}

// the layout viewport: innerWidth counts the vertical scrollbar, under which
// a widget's right edge (and a right column) would then land — and so does
// clientWidth while a dialog keeps the scrollbar's gutter in its place
/** @returns {number} */
export function viewportWidth() {
	return document.documentElement.clientWidth - scrollbarGutter;
}

/** @returns {number} */
export function viewportHeight() {
	return document.documentElement.clientHeight;
}
