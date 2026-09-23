import { el } from '../lib/dom.js';
import { MAP_TYPES } from './types.js';

// Drawing maps from their catalog entries: a block's title bar, its map as
// its type draws it, the links under it, and the rows a map takes in a table.
// Both pages draw with this — the landing page as it is, the customize page
// with the widgets' buttons in every title bar, which it passes in
// (options.titleButtons) so that this knows nothing of widgets.
//
// options.titleButtons(interactive): the extra buttons of a title bar, or
// nothing; interactive for an interactive map, whose bar has its own gate
// button in place of a reload

// A map can be on screen more than once: the widget's [D] makes another showing
// of it (widgets/copies.js), and a showing beyond the first is a widget and nothing
// else — the page keeps one row per map however many float over it. So a block
// is named twice: by the map it shows (`data-map-id`, which is the catalog's)
// and by which showing of it this is (`data-inst`). The render's own block is
// the first, so its instance key is the plain id and every layout written
// before copies existed still reads; a further one carries `#2`, `#3`.
//
// The parts inside a block that carry a name of their own — a slideshow and
// its indicators, a frame and the ids built off it — take a suffix from the
// index instead of the key, since a frame's id is also pasted into other ids
// and read back with getElementById, where a `#` has no business being.
const INST_SEP = '#';

export function instKey(mapId, index) {
	return index > 1 ? `${mapId}${INST_SEP}${index}` : mapId;
}

export function instMapId(inst) {
	return String(inst).split(INST_SEP)[0];
}

export function instIndex(inst) {
	const index = Number(String(inst).split(INST_SEP)[1]);
	return index > 1 ? index : 1;
}

export function instSuffix(inst) {
	const index = instIndex(inst);
	return index > 1 ? `Copy${index}` : '';
}

function maxWidthStyle(map) {
	return map.maxWidth ? `max-width: ${map.maxWidth}px;` : '';
}

// map is optional and only supplies the width: slide title bars are
// unconstrained, their max-width sits on the .placeholder wrapper below;
// buttons, when given, go in a cluster on the right
function buildTitleBar(title, map = {}, buttons = null) {
	return el('div', { class: 'radartitle', style: maxWidthStyle(map) || undefined }, [
		el('a', { href: title.href, target: '_blank', rel: 'nofollow', text: title.text }),
		buttons && buttons.length ? el('span', { class: 'right right-cluster' }, buttons) : null
	]);
}

function titleButtons(options, interactive = false) {
	return options.titleButtons ? options.titleButtons(interactive) : null;
}

// top-level title bars show the map's picker name; only slide titles
// carry their own text (it differs per slide)
function buildMapTitleBar(map, options) {
	return buildTitleBar({ text: map.title || map.name, href: map.titleHref }, map, titleButtons(options));
}

export function buildSlideshow(map, inst, options = {}) {
	const slideshowId = map.id + instSuffix(inst);
	const start = map.startSlide || 1;
	const titled = map.slides.some(slide => slide.title);

	const container = el('div', {
		class: titled ? 'slideshow' : 'slideshow placeholder',
		'data-slideshow-id': slideshowId,
		'data-current-slide': start,
		'data-dynamic-width': map.dynamicWidth ? '' : undefined,
		style: (maxWidthStyle(map) + (titled ? '' : ` aspect-ratio: ${map.aspect};`)).trim() || undefined
	});

	map.slides.forEach((slide, i) => {
		const active = i === start - 1;
		const url = titled ? slide.img : slide;
		const img = (active || map.eagerSlides)
			? el('img', { src: url })
			: el('img', { 'data-src': url, class: 'lazy' });
		const slideDiv = el('div', { class: 'slide fade' + (active ? ' active' : '') });
		if (titled) {
			const width = slide.maxWidth || map.maxWidth;
			// a slide may omit its title text to inherit the map name (its href still differs per slide);
			// without a map-level title bar the slide bars carry the pop-out button instead
			const title = { text: slide.title.text || map.name, href: slide.title.href };
			slideDiv.appendChild(buildTitleBar(title, {}, map.titleHref ? null : titleButtons(options)));
			slideDiv.appendChild(el('div', {
				class: 'placeholder',
				style: `${width ? `max-width: ${width}px; ` : ''}aspect-ratio: ${slide.aspect};`
			}, [img]));
		} else {
			slideDiv.appendChild(img);
		}
		container.appendChild(slideDiv);
	});

	const prev = el('a', { class: 'prev' + (titled ? ' shorter' : ''), 'data-action': 'slide', 'data-step': '-1', html: '&#10094;' });
	const next = el('a', { class: 'next' + (titled ? ' shorter' : ''), 'data-action': 'slide', 'data-step': '1', html: '&#10095;' });
	container.appendChild(prev);
	container.appendChild(next);

	const indicators = el('div', {
		class: 'indicators-container',
		'data-slideshow-id': slideshowId,
		style: `${maxWidthStyle(map)} grid-template-columns: repeat(${map.slides.length}, 1fr);`.trim()
	});
	map.slides.forEach((slide, i) => {
		indicators.appendChild(el('span', { class: 'indicator' + (i === start - 1 ? ' active' : '') }));
	});

	return [map.titleHref ? buildMapTitleBar(map, options) : null, container, indicators];
}

export function buildImage(map, inst, options = {}) {
	return [
		buildMapTitleBar(map, options),
		el('div', { class: 'placeholder', style: `${maxWidthStyle(map)} aspect-ratio: ${map.aspect};`.trim() }, [
			el('img', { src: map.img, alt: map.alt })
		])
	];
}

export function buildVideo(map, inst, options = {}) {
	const video = el('video', { controls: '' }, [el('source', { type: 'video/mp4', src: map.src })]);
	video.muted = true;
	video.autoplay = true;
	video.loop = true;
	// without an aspect the wrapper's padding-top (.vid1) sizes the box
	const style = `${maxWidthStyle(map)}${map.aspect ? ` aspect-ratio: ${map.aspect};` : ''}`.trim();
	return [
		buildMapTitleBar(map, options),
		el('div', { class: 'placeholder', style: style || undefined }, [
			el('div', { class: 'vid1' }, [video])
		])
	];
}

export function buildIframe(map, inst, options = {}) {
	const frameId = map.frameId + instSuffix(inst);
	const pascal = frameId[0].toUpperCase() + frameId.slice(1);

	const zoomBtn = el('a', { class: 'left zoom-btn', 'data-mode': 'hr', 'data-action': 'zoom', 'data-frame': frameId, text: '[HR]' });
	const fsBtn = el('a', { class: 'fs-btn', 'data-action': 'fullscreen', 'data-frame': frameId, text: '[ ]' });

	const title = el('div', { class: 'radartitle' }, [
		zoomBtn,
		el('a', { class: 'center', href: map.titleHref, target: '_blank', rel: 'nofollow', text: map.name }),
		el('span', { class: 'right right-cluster' }, [
			...(titleButtons(options, true) || []),
			el('a', { id: `reset${pascal}Frame`, 'data-frame-id': frameId, 'data-action': 'gate', style: 'display:none', text: '[X]' }),
			fsBtn
		])
	]);

	const body = el('div', { class: 'if1 placeholder' }, [
		el('iframe', {
			id: frameId,
			class: map.scaled ? 'scaled-iframe' : undefined,
			loading: map.loading || 'lazy',
			frameborder: '0',
			'data-src-hr': map.srcHr,
			'data-zoom-hr-desktop': map.zoomHrDesktop,
			'data-zoom-hr-mobile': map.zoomHrMobile,
			'data-src-eu': map.srcEu,
			'data-zoom-eu-desktop': map.zoomEuDesktop,
			'data-zoom-eu-mobile': map.zoomEuMobile
		}),
		el('div', { class: 'overlay', id: `overlay${pascal}Frame`, 'data-frame-id': frameId }, [
			el('span', { class: 'hint', text: 'Dvostruki klik za pristup interaktivnoj karti' })
		])
	]);

	return [title, body];
}

export function buildBasicIframe(map, inst, options = {}) {
	return [
		buildMapTitleBar(map, options),
		el('div', { class: 'if2 placeholder' }, [
			el('iframe', { loading: 'lazy', src: map.src, frameborder: '0', scrolling: 'no' })
		])
	];
}

export function buildLinksBottom(map) {
	const bar = el('div', { class: 'links-bottom', style: maxWidthStyle(map) || undefined });
	map.links.forEach((link, i) => {
		if (i > 0) bar.appendChild(document.createTextNode(' · '));
		bar.appendChild(el('a', { href: link.href, target: '_blank', rel: 'nofollow', text: link.text }));
	});
	return bar;
}

// a map's block contents, drawn the way its type draws it (maps/types.js)
export function buildMapContent(map, inst = map.id, options = {}) {
	const type = MAP_TYPES[map.type];
	return type ? type.build(map, inst, options) : [];
}

// the table's rows for a list of maps, or a line saying there are none
export function renderMapRows(tbody, maps, options = {}) {
	tbody.replaceChildren();
	if (!maps.length) {
		tbody.appendChild(el('tr', {}, [
			el('td', { align: 'center' }, [
				el('div', { class: 'maps-empty', text: 'Nema odabranih karata. Odaberite ih pod "Karte".' })
			])
		]));
		return;
	}
	maps.forEach(map => appendMapRows(tbody, map, options));
}

// the rows a map takes at the end of the table — a spacer after the one
// before, its block, and the links under it — returning the block. One block
// per map, so the pop-out can lift title, map and indicators together
export function appendMapRows(tbody, map, options = {}) {
	if (tbody.children.length) tbody.appendChild(el('tr', { class: 'sp20' }));
	const block = el('div', { class: 'map-block', 'data-map-id': map.id, 'data-inst': map.id }, buildMapContent(map, map.id, options));
	tbody.appendChild(el('tr', {}, [el('td', { align: 'center' }, [block])]));
	if (map.links && map.links.length) {
		tbody.appendChild(el('tr', {}, [el('td', { align: 'center' }, [buildLinksBottom(map)])]));
	}
	return block;
}
