// Numbers and the viewport they are measured in.

export function clamp(value, min, max) {
	return Math.min(Math.max(value, min), Math.max(min, max));
}

// a fraction as stored: four decimals, a tenth of a pixel on a 1000px screen
export function roundFraction(n) {
	return Math.round(n * 10000) / 10000;
}

// a position as written: thousandths of a pixel, the layout unit being 1/64px.
// Whole pixels would cost the magnets their landing (see moveGroup)
export function subpixel(v) {
	return Math.round(v * 1000) / 1000;
}

// the scrollbar's width while a dialog holds its place (page/dialog.js), 0
// otherwise
let scrollbarGutter = 0;

export function setScrollbarGutter(px) {
	scrollbarGutter = px;
}

// the layout viewport: innerWidth counts the vertical scrollbar, under which
// a widget's right edge (and a right column) would then land — and so does
// clientWidth while a dialog keeps the scrollbar's gutter in its place
export function viewportWidth() {
	return document.documentElement.clientWidth - scrollbarGutter;
}

export function viewportHeight() {
	return document.documentElement.clientHeight;
}
