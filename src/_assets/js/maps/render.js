import { el } from '../lib/dom.js';
import { EVENTS, on } from '../lib/events.js';
import { initDynamicContent } from '../page/content.js';
import { exitFullscreen } from '../page/iframe.js';
import { isMapEnabled } from '../remote-config.js';
import { closeMsAdd } from '../settings/add-menu.js';
import { resetSnapColumns } from '../widgets/columns.js';
import { buildDuplicateButton } from '../widgets/copies.js';
import { buildGroupButton } from '../widgets/groups.js';
import { applySnapLayout, currentSnapLayout, sanitizeSnapLayout, withPersistPaused } from '../widgets/layout.js';
import { buildPopoutButton } from '../widgets/popout.js';
import { buildReloadButton } from '../widgets/reload.js';
import { catalogMap } from './catalog.js';
import { resolveMapIds } from './prefs.js';
import { MAP_TYPES } from './types.js';

// Drawing the customize page's maps into <tbody data-maps>: one block per map,
// built from its catalog entry.
//
// Which maps are off comes from remote-config.js (isMapEnabled). Off is hidden, not removed: lists, presets and links keep the id, and the map
// is back in its place in the list once it is on again. Not on the screen,
// though: the arrangement is written off what is up, so the next write drops a
// map that is off, and on again it comes in where any map new to the view does
// (docked, or down the cascade on a board). Only what is shown leaves it out —
// the render, the tab's [+] menu and the dialog's rows (hidden, not left out,
// so a list saved from the dialog still holds it)
let mapsRendered = false; // from the first render on, a change is applied in place

export function initRerender() {
	on(EVENTS.mapConfigChanged, () => {
		if (mapsRendered) rerenderMaps();
	});
}

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
// popout adds the pop-out button (desktop only, see the pop-out section)
function buildTitleBar(title, map = {}, popout = false) {
	return el('div', { class: 'radartitle', style: maxWidthStyle(map) || undefined }, [
		el('a', { href: title.href, target: '_blank', rel: 'nofollow', text: title.text }),
		popout ? el('span', { class: 'right right-cluster' },
			[buildDuplicateButton(), buildReloadButton(), buildGroupButton(), buildPopoutButton()]) : null
	]);
}

// top-level title bars show the map's picker name; only slide titles
// carry their own text (it differs per slide)
function buildMapTitleBar(map) {
	return buildTitleBar({ text: map.name, href: map.titleHref }, map, true);
}

export function buildSlideshow(map, inst) {
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
			slideDiv.appendChild(buildTitleBar(title, {}, !map.titleHref));
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

	return [map.titleHref ? buildMapTitleBar(map) : null, container, indicators];
}

export function buildImage(map) {
	return [
		buildMapTitleBar(map),
		el('div', { class: 'placeholder', style: `${maxWidthStyle(map)} aspect-ratio: ${map.aspect};`.trim() }, [
			el('img', { src: map.img, alt: map.alt })
		])
	];
}

export function buildVideo(map) {
	const video = el('video', { controls: '' }, [el('source', { type: 'video/mp4', src: map.src })]);
	video.muted = true;
	video.autoplay = true;
	video.loop = true;
	// without an aspect the wrapper's padding-top (.vid1) sizes the box
	const style = `${maxWidthStyle(map)}${map.aspect ? ` aspect-ratio: ${map.aspect};` : ''}`.trim();
	return [
		buildMapTitleBar(map),
		el('div', { class: 'placeholder', style: style || undefined }, [
			el('div', { class: 'vid1' }, [video])
		])
	];
}

export function buildIframe(map, inst) {
	const frameId = map.frameId + instSuffix(inst);
	const pascal = frameId[0].toUpperCase() + frameId.slice(1);

	const zoomBtn = el('a', { class: 'left zoom-btn', 'data-mode': 'hr', 'data-action': 'zoom', 'data-frame': frameId, text: '[HR]' });
	const fsBtn = el('a', { class: 'fs-btn', 'data-action': 'fullscreen', 'data-frame': frameId, text: '[ ]' });

	const title = el('div', { class: 'radartitle' }, [
		zoomBtn,
		el('a', { class: 'center', href: map.titleHref, target: '_blank', rel: 'nofollow', text: map.name }),
		el('span', { class: 'right right-cluster' }, [
			buildDuplicateButton(),
			buildGroupButton(),
			buildPopoutButton(),
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

export function buildBasicIframe(map) {
	return [
		buildMapTitleBar(map),
		el('div', { class: 'if2 placeholder' }, [
			el('iframe', { loading: 'lazy', src: map.src, frameborder: '0', scrolling: 'no' })
		])
	];
}

function buildLinksBottom(map) {
	const bar = el('div', { class: 'links-bottom', style: maxWidthStyle(map) || undefined });
	map.links.forEach((link, i) => {
		if (i > 0) bar.appendChild(document.createTextNode(' · '));
		bar.appendChild(el('a', { href: link.href, target: '_blank', rel: 'nofollow', text: link.text }));
	});
	return bar;
}

// a map's block contents, drawn the way its type draws it (maps/types.js)
export function buildMapContent(map, inst = map.id) {
	const type = MAP_TYPES[map.type];
	return type ? type.build(map, inst) : [];
}

export function renderMaps() {
	const tbody = document.querySelector('tbody[data-maps]');
	if (!tbody) return;
	// a fullscreen map goes with the tbody too, and would leave the page's
	// scroll locked behind it; taken down as the arrangement it is part of
	// is (what comes back is applied after the render)
	withPersistPaused(() => document.querySelectorAll('.if1.fullscreen').forEach(exitFullscreen));
	resetSnapColumns(); // their panes go with the tbody
	tbody.replaceChildren();
	mapsRendered = true;
	const maps = resolveMapIds().map(catalogMap).filter(map => map && isMapEnabled(map.id));
	if (!maps.length) {
		tbody.appendChild(el('tr', {}, [
			el('td', { align: 'center' }, [
				el('div', { class: 'maps-empty', text: 'Nema odabranih karata. Odaberite ih pod "Karte".' })
			])
		]));
		return;
	}
	maps.forEach(map => appendMapRows(tbody, map));
}

// the rows a map takes at the end of the table — a spacer after the one
// before, its block, and the links under it — returning the block. One block
// per map, so the pop-out can lift title, map and indicators together
export function appendMapRows(tbody, map) {
	if (tbody.children.length) tbody.appendChild(el('tr', { class: 'sp20' }));
	const block = el('div', { class: 'map-block', 'data-map-id': map.id, 'data-inst': map.id }, buildMapContent(map));
	tbody.appendChild(el('tr', {}, [el('td', { align: 'center' }, [block])]));
	if (map.links && map.links.length) {
		tbody.appendChild(el('tr', {}, [el('td', { align: 'center' }, [buildLinksBottom(map)])]));
	}
	return block;
}

// the remote config changed under maps already out: the view is drawn again the
// way Primijeni draws it, the arrangement carried over from the screen, so a map
// switched off goes and one switched on comes back — docked on the page, down
// the cascade on a board. Every frame reloads, which a config change is rare
// enough to afford
function rerenderMaps() {
	const layout = sanitizeSnapLayout(currentSnapLayout(), resolveMapIds());
	closeMsAdd();
	renderMaps();
	initDynamicContent();
	applySnapLayout(layout);
}
