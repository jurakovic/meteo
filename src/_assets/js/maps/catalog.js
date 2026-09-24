// The map catalog: every map the customize page can show, with its source,
// its kind, how it is drawn (maps/render.js) and the links offered under it.
// The ids are written into saved preferences and shared links, so an id,
// once published, stays.

/** @typedef {{ text: string, href: string }} MapLink */

/**
 * A slide with a title bar of its own; a slideshow without titles lists bare
 * image addresses instead.
 * @typedef {{ title: { text?: string, href: string }, img: string, aspect: string, maxWidth?: number }} TitledSlide
 */

/**
 * One map. Which of the optional fields apply depends on its `type`, the key
 * into maps/types.js.
 * @typedef {object} CatalogMap
 * @property {string} id stable: saved preferences and shared links carry it
 * @property {string} category a key of CATEGORY_GLYPHS
 * @property {string} name the name in the picker and on the title bar
 * @property {'slideshow' | 'iframe' | 'iframe-basic' | 'image' | 'video'} type
 * @property {string} [title] a fuller title bar than the picker's name
 * @property {string} [titleHref] where the title bar links to
 * @property {string} [aspect] width / height, as CSS aspect-ratio takes it
 * @property {number} [maxWidth] the width the map was made for (px)
 * @property {MapLink[]} [links] the bar of links under the map
 * @property {(string | TitledSlide)[]} [slides] slideshow: its images
 * @property {number} [startSlide] slideshow: the one shown first, from 1
 * @property {boolean} [eagerSlides] slideshow: load every slide at once
 * @property {boolean} [dynamicWidth] slideshow: the width follows the slide
 * @property {string} [img] image: its address
 * @property {string} [alt] image: its text
 * @property {string} [src] video, basic frame: its address
 * @property {string} [frameId] interactive frame: the id its controls name
 * @property {string} [srcHr] interactive frame: the Croatian view
 * @property {string} [srcEu] interactive frame: the European view
 * @property {string} [zoomHrDesktop] interactive frame: zoom levels, per view and screen
 * @property {string} [zoomHrMobile]
 * @property {string} [zoomEuDesktop]
 * @property {string} [zoomEuMobile]
 * @property {boolean} [scaled] interactive frame: drawn at a larger size and scaled down
 * @property {string} [loading] interactive frame: the iframe's loading, lazy unless said
 * @property {string} [backdrop] a letterboxed widget's ground when there is no image to take it from
 */

const RADAR_HR_LINKS = [
	{ text: 'Windy', href: 'https://www.windy.com/-Weather-radar-radar?radar,44.5,16.5,7' },
	{ text: 'Zoom Earth', href: 'https://zoom.earth/maps/radar/#view=44.5,16.5,7z' },
	{ text: 'meteoblue', href: 'https://www.meteoblue.com/en/weather/maps/croatia_croatia_3202326#map=radar~radarMapEU~none~none~none&coords=6/44.5/16.5' },
	{ text: 'Rain Viewer', href: 'https://www.rainviewer.com/map.html?loc=44.5,16.5,6&oCS=1&c=5&lm=1&layer=radar&sm=1&sn=2&ts=1' },
	{ text: 'Ventusky', href: 'https://www.ventusky.com/?p=44.5;16.5;6&l=radar&w=off' },
	{ text: 'Vrijeme&Radar', href: 'https://www.vrijemeradar.hr/vremenski-radar/zagreb/18138691?center=44.5,16.5&zoom=7&layer=wr&tz=Europe%2FZagreb' },
	{ text: 'Sat24', href: 'https://www.sat24.com/en-gb/country/hr/hd#selectedLayer=euRadarSat' },
	{ text: "I'm Weather", href: 'https://imweather.com/?model=nowcast&run=&member=&element=radsat&level=&lat=44.5000&lng=16.5000&z=6' },
	{ text: 'Időkép', href: 'https://www.idokep.eu/adria' }
];

const RADAR_EU_LINKS = [
	{ text: 'Windy', href: 'https://www.windy.com/-Weather-radar-radar?radar,47.5,17.5,5' },
	{ text: 'Zoom Earth', href: 'https://zoom.earth/maps/radar/#view=47.5,17.5,5z' },
	{ text: 'meteoblue', href: 'https://www.meteoblue.com/en/weather/maps/croatia_croatia_3202326#map=radar~radarMapEU~none~none~none&coords=4/47.5/17.5' },
	{ text: 'Rain Viewer', href: 'https://www.rainviewer.com/map.html?loc=47.5,17.5,4&oCS=1&c=5&lm=1&layer=radar&sm=1&sn=2&ts=1' },
	{ text: 'Ventusky', href: 'https://www.ventusky.com/?p=47.5;17.5;4&l=radar&w=off' },
	{ text: 'Vrijeme&Radar', href: 'https://www.vrijemeradar.hr/vremenski-radar/zagreb/18138691?center=47.5,15.5&zoom=5&layer=wr&tz=Europe%2FZagreb' },
	{ text: 'Sat24', href: 'https://www.sat24.com/en-gb/continent/eu/hd#selectedLayer=euRadarSat' },
	{ text: "I'm Weather", href: 'https://imweather.com/?model=nowcast&run=&member=&element=radsat&level=&lat=47.5000&lng=17.5000&z=4.2' }
];

const SAT_HR_LINKS = [
	{ text: 'Windy', href: 'https://www.windy.com/-Satellite-satellite?satellite,44.5,16.5,7' },
	{ text: 'Zoom Earth', href: 'https://zoom.earth/maps/satellite/#view=44.5,16.5,7z' },
	{ text: 'meteoblue', href: 'https://www.meteoblue.com/en/weather/maps/croatia_croatia_3202326#map=satellite~radar~none~none~none&coords=6/44.5/16.5' },
	{ text: 'Ventusky', href: 'https://www.ventusky.com/?p=44.5;16.5;6&l=satellite&w=off' },
	{ text: 'Sat24', href: 'https://www.sat24.com/en-gb/country/hr/hd' },
	{ text: "I'm Weather", href: 'https://imweather.com/?model=nowcast&element=satellite&run=&member=&level=&lat=44.5000&lng=16.5000&z=6' }
];

const SAT_EU_LINKS = [
	{ text: 'Windy', href: 'https://www.windy.com/-Satellite-satellite?satellite,47.5,17.5,5' },
	{ text: 'Zoom Earth', href: 'https://zoom.earth/maps/satellite/#view=47.5,17.5,5z' },
	{ text: 'meteoblue', href: 'https://www.meteoblue.com/en/weather/maps/croatia_croatia_3202326#map=satellite~radar~none~none~none&coords=4/47.5/17.5' },
	{ text: 'Ventusky', href: 'https://www.ventusky.com/?p=47.5;17.5;4&l=satellite&w=off' },
	{ text: 'Sat24', href: 'https://www.sat24.com/en-gb/continent/eu/hd' },
	{ text: "I'm Weather", href: 'https://imweather.com/?model=nowcast&element=satellite&run=&member=&level=&lat=47.5000&lng=17.5000&z=4.2' },
	{ text: 'Wetterzentrale', href: 'https://www.wetterzentrale.de/en/reanalysis.php?map=1&model=sat&var=404&nmaps=32' }
];

const TEMP_HR_LINKS = [
	{ text: 'Windy', href: 'https://www.windy.com/-Temperature-temp?temp,44.5,16.5,7' },
	{ text: 'Zoom Earth', href: 'https://zoom.earth/maps/temperature/#view=44.5,16.5,7z/model=icon' },
	{ text: 'meteoblue', href: 'https://www.meteoblue.com/en/weather/maps/croatia_croatia_3202326#map=temperature~daily-max~auto~2%20m%20above%20gnd~none&coords=6/44.5/16.5' },
	{ text: 'Ventusky', href: 'https://www.ventusky.com/?p=44.49;16.50;6&l=temperature-2m&w=off' },
	{ text: 'Vrijeme&Radar', href: 'https://www.vrijemeradar.hr/vremenski-radar/zagreb/18138691?center=44.5,16.5&zoom=7&layer=tr&tz=Europe%2FZagreb' },
	{ text: 'Meteoradar', href: 'https://www.meteoradar.co.uk/en-gb/country/hr/maps/temperature' },
	{ text: 'Meteociel', href: 'https://www.meteociel.fr/observations-meteo/temperatures.php?region=it' },
	{ text: 'Pljusak', href: 'https://pljusak.com/karta.php' }
];

const STORM_LINKS = [
	{ text: 'ESSL', href: 'https://weather.essl.org/storm/' },
	{ text: 'ASTORP', href: 'https://rawinsonde.com/ASTORP/ESTOFEX.html' },
	{ text: 'ESTOFEX', href: 'https://www.estofex.org' },
	{ text: 'ESWD', href: 'https://www.eswd.eu' }
];

// a map's own site is already linked from its title bar, so drop it from the
// row of alternatives below
function except(links, name) {
	return links.filter(link => link.text !== name);
}

export const CATEGORY_GLYPHS = {
	radar: '📡',
	satelit: '🛰️',
	munje: '⚡',
	temperatura: '🌡️',
	nevrijeme: '⛈️',
	sinoptika: '🗺️',
	kamera: '📷',
	prognoza: '📈'
};

// one of DHMZ's radar stations: its loop and its latest picture, as a slideshow
/** @param {string} id @param {string} name @returns {CatalogMap} */
function dhmzMrcRadar(id, name) {
	return {
		id: `dhmz-${id}`,
		category: 'radar',
		name: `DHMZ | MRC ${name}`,
		type: 'slideshow',
		titleHref: `https://meteo.hr/podaci.php?section=podaci_mjerenja&param=radari&el=${id}&acto=anim`,
		maxWidth: 720,
		aspect: '720 / 751',
		slides: [`https://vrijeme.hr/anim_${id}.gif`, `https://vrijeme.hr/${id}-stat.png`]
	};
}

/** @type {CatalogMap[]} */
export const MAP_CATALOG = [
	{
		id: 'neverin-radar-hr',
		category: 'radar',
		name: 'Neverin | Radar | Hrvatska',
		type: 'slideshow',
		titleHref: 'https://www.neverin.hr/radar/',
		aspect: '880 / 640',
		startSlide: 2,
		slides: [
			'https://maps.neverin.hr/radar/latest/hr/latest.webp',
			'https://maps.neverin.hr/radar/latest/hr/anim.webp',
			'https://maps.neverin.hr/radar/latest/hr/anim_6h.webp'
		],
		links: RADAR_HR_LINKS
	},
	{
		id: 'neverin-satelit-hr',
		category: 'satelit',
		name: 'Neverin | Satelit | Hrvatska',
		type: 'slideshow',
		titleHref: 'https://www.neverin.hr/satelit/',
		aspect: '880 / 640',
		startSlide: 2,
		slides: [
			'https://maps.neverin.hr/satellite/rgb_geocolour/latest/hr/latest.webp',
			'https://maps.neverin.hr/satellite/rgb_geocolour/latest/hr/anim.webp',
			'https://maps.neverin.hr/satellite/rgb_geocolour/latest/hr/anim_6h.webp'
		],
		links: SAT_HR_LINKS
	},
	{
		id: 'neverin-radar-eu',
		category: 'radar',
		name: 'Neverin | Radar | Europa',
		type: 'slideshow',
		titleHref: 'https://www.neverin.hr/radar/',
		aspect: '880 / 640',
		startSlide: 2,
		slides: [
			'https://maps.neverin.hr/radar/latest/eu2/latest.webp',
			'https://maps.neverin.hr/radar/latest/eu2/anim.webp',
			'https://maps.neverin.hr/radar/latest/eu2/anim_6h.webp'
		],
		links: RADAR_EU_LINKS
	},
	{
		id: 'neverin-satelit-eu',
		category: 'satelit',
		name: 'Neverin | Satelit | Europa',
		type: 'slideshow',
		titleHref: 'https://www.neverin.hr/satelit/',
		aspect: '880 / 640',
		startSlide: 2,
		slides: [
			'https://maps.neverin.hr/satellite/rgb_geocolour/latest/eu2/latest.webp',
			'https://maps.neverin.hr/satellite/rgb_geocolour/latest/eu2/anim.webp',
			'https://maps.neverin.hr/satellite/rgb_geocolour/latest/eu2/anim_6h.webp'
		],
		links: SAT_EU_LINKS
	},
	{
		id: 'windy',
		category: 'radar',
		name: 'Windy',
		type: 'iframe',
		frameId: 'windy',
		titleHref: 'https://www.windy.com/-Radar-lightning-radar?radar,44.5,16.5,7',
		srcHr: 'https://embed.windy.com/embed2.html?lat=44.5&lon=16.56&zoom=7&level=surface&overlay=radar&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=45.798&detailLon=15.936&metricWind=m%2Fs&metricTemp=%C2%B0C&radarRange=-1',
		zoomHrDesktop: '&zoom=7',
		zoomHrMobile: '&zoom=6',
		srcEu: 'https://embed.windy.com/embed2.html?lat=48.0&lon=10.00&zoom=5&level=surface&overlay=radar&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=45.798&detailLon=15.936&metricWind=m%2Fs&metricTemp=%C2%B0C&radarRange=-1',
		zoomEuDesktop: '&zoom=5',
		zoomEuMobile: '&zoom=3',
		links: except(RADAR_HR_LINKS, 'Windy')
	},
	{
		id: 'dhmz-radar',
		category: 'radar',
		name: 'DHMZ | Radar | Hrvatska',
		type: 'slideshow',
		titleHref: 'https://meteo.hr/podaci.php?section=podaci_mjerenja&param=radari&el=kompozit&acto=anim',
		maxWidth: 720,
		aspect: '720 / 751',
		slides: [
			'https://vrijeme.hr/anim_kompozit.gif',
			'https://vrijeme.hr/kompozit-stat.png'
		],
		links: RADAR_HR_LINKS
	},
	{
		id: 'meteociel-temp',
		category: 'temperatura',
		name: 'Meteociel.fr | Temperatura',
		type: 'slideshow',
		maxWidth: 768,
		slides: [
			{
				title: { text: 'Meteociel.fr | Temperatura', href: 'https://www.meteociel.fr/observations-meteo/temperatures.php?region=it' },
				img: 'https://www.meteociel.fr/cartes_obs/temp_it.png',
				aspect: '1'
			},
			{
				title: { text: 'Meteociel.fr | Temperatura', href: 'https://www.meteociel.fr/observations-meteo/temperatures.php?region=eur2' },
				img: 'https://www.meteociel.com/cartes_obs/temp_eur2.png',
				aspect: '1'
			}
		],
		links: except(TEMP_HR_LINKS, 'Meteociel')
	},
	{
		id: 'blitzortung',
		category: 'munje',
		name: 'Blitzortung.org | Munje',
		type: 'iframe',
		frameId: 'blitzortung',
		titleHref: 'https://map.blitzortung.org/#6/44.5/16.5',
		srcHr: 'https://map.blitzortung.org/index.php?interactive=1&NavigationControl=1&FullScreenControl=0&Cookies=0&InfoDiv=0&MenuButtonDiv=0&ScaleControl=0&CirclesRangeValue=1&LinksCheckboxChecked=0&LinksRangeValue=0&MapStyle=1&MapStyleRangeValue=3&Advertisment=0#6/44.5/16.5',
		zoomHrDesktop: '#6/',
		zoomHrMobile: '#5/',
		srcEu: 'https://map.blitzortung.org/index.php?interactive=1&NavigationControl=1&FullScreenControl=0&Cookies=0&InfoDiv=0&MenuButtonDiv=0&ScaleControl=0&CirclesRangeValue=1&LinksCheckboxChecked=0&LinksRangeValue=0&MapStyle=1&MapStyleRangeValue=3&Advertisment=0#4/48.0/10.0',
		zoomEuDesktop: '#4/',
		zoomEuMobile: '#2.5/',
		links: [
			{ text: 'Blitzortung.org', href: 'https://www.blitzortung.org/en/historical_maps.php?map=10' },
			{ text: 'LightningMaps.org', href: 'https://www.lightningmaps.org/?lang=en#m=sen;t=3;s=200;o=0;b=0.00;ts=0;z=7;y=44.5;x=16.5;d=4;dl=6;dc=0;' },
			{ text: 'Neverin', href: 'https://www.neverin.hr/munje/' }
		]
	},
	{
		id: 'essl',
		category: 'nevrijeme',
		name: 'ESSL | Prognoza nevremena',
		type: 'slideshow',
		titleHref: 'https://stormforecast.eu',
		maxWidth: 900,
		aspect: '900 / 600',
		startSlide: 2,
		slides: [
			'https://meteo-data.jurakovic.workers.dev/essl/img1.png',
			'https://meteo-data.jurakovic.workers.dev/essl/img2.png',
			'https://meteo-data.jurakovic.workers.dev/essl/img3.png'
		],
		links: except(STORM_LINKS, 'ESSL')
	},
	{
		id: 'astorp',
		category: 'nevrijeme',
		name: 'ASTORP | Prognoza nevremena',
		type: 'slideshow',
		titleHref: 'https://rawinsonde.com/ASTORP/ESTOFEX.html',
		aspect: '1048 / 850',
		slides: [
			'https://rawinsonde.com/ASTORP/Results/ESTOFEX_DAY_1.jpg',
			'https://rawinsonde.com/ASTORP/Results/ESTOFEX_DAY_2.jpg',
			'https://rawinsonde.com/ASTORP/Results/ESTOFEX_DAY_3.jpg',
			'https://rawinsonde.com/ASTORP/Results/ESTOFEX_DAY_4.jpg',
			'https://rawinsonde.com/ASTORP/Results/ESTOFEX_DAY_5.jpg',
			'https://rawinsonde.com/ASTORP/Results/ESTOFEX_DAY_6.jpg',
			'https://rawinsonde.com/ASTORP/Results/ESTOFEX_DAY_7.jpg'
		],
		links: except(STORM_LINKS, 'ASTORP')
	},
	{
		id: 'estofex',
		category: 'nevrijeme',
		name: 'ESTOFEX | Prognoza nevremena',
		type: 'slideshow',
		titleHref: 'https://www.estofex.org',
		maxWidth: 800,
		aspect: '1',
		slides: [
			'https://meteo-data.jurakovic.workers.dev/estofex/img1.png',
			'https://meteo-data.jurakovic.workers.dev/estofex/img2.png'
		],
		links: except(STORM_LINKS, 'ESTOFEX')
	},
	{
		id: 'eumetnet',
		category: 'radar',
		name: 'EUMETNET',
		type: 'iframe-basic',
		titleHref: 'https://www.eumetnet.eu/observations/opera-radar-animation/',
		src: 'https://cdn.fmi.fi/demos/eumetnet-web-site-radar-animator/',
		links: RADAR_EU_LINKS
	},
	{
		id: 'meteociel-satelit',
		category: 'satelit',
		name: 'Meteociel.fr | Satelit',
		type: 'slideshow',
		maxWidth: 768,
		slides: [
			{
				title: { text: 'Meteociel.fr | Satelit', href: 'https://www.meteociel.fr/observations-meteo/satellite.php?mode=animation-infrarouge-noir-et-blanc-hd-mtg' },
				img: 'https://modeles20.meteociel.fr/satellite/animsatirmtgeu.gif',
				aspect: '1'
			},
			{
				title: { text: 'Meteociel.fr | Satelit', href: 'https://www.meteociel.fr/observations-meteo/satellite.php?mode=infrarouge-noir-et-blanc-hd-mtg' },
				img: 'https://modeles20.meteociel.fr/satellite/latestsatirmtgeu.png',
				aspect: '1'
			}
		],
		links: SAT_EU_LINKS
	},
	{
		id: 'chmi-sinopticka',
		category: 'sinoptika',
		name: 'ČHMÚ | Sinoptička karta',
		type: 'slideshow',
		maxWidth: 760,
		// only has an effect on titled slideshows: updateSlideshowWidth (page/slideshow.js)
		// reads the active slide's .placeholder wrapper, which untitled slides lack
		dynamicWidth: true,
		slides: [
			{
				title: { href: 'https://intranet.chmi.cz/aktualni-situace/aktualni-stav-pocasi/evropa/synopticka-situace' },
				img: 'https://intranet.chmi.cz/files/portal/docs/meteo/om/evropa/analyza.gif',
				aspect: '760 / 492'
			},
			{
				title: { href: 'https://intranet.chmi.cz/predpovedi/predpovedi-pocasi/evropa/synopticka-situace' },
				img: 'https://intranet.chmi.cz/files/portal/docs/meteo/om/evropa/preba/preba36.gif',
				aspect: '760 / 435'
			},
			{
				title: { href: 'https://intranet.chmi.cz/predpovedi/predpovedi-pocasi/evropa/synopticka-situace' },
				img: 'https://intranet.chmi.cz/files/portal/docs/meteo/om/evropa/preba/preba60.gif',
				aspect: '760 / 435'
			},
			{
				title: { href: 'https://intranet.chmi.cz/predpovedi/predpovedi-pocasi/evropa/synopticka-situace' },
				img: 'https://intranet.chmi.cz/files/portal/docs/meteo/om/evropa/preba/preba84.gif',
				aspect: '760 / 435'
			}
		],
		links: [
			{ text: 'DHMZ', href: 'https://meteo.hr/prognoze.php?section=prognoze_model&param=web_fronte_sutra12' }
		]
	},
	{
		id: 'neverin-kamera',
		category: 'kamera',
		name: 'Neverin | Kamera | Zagreb',
		title: 'Neverin | Kamera | Zagreb-Remetinečki rotor', // the title bar's; name is the lists'
		type: 'image',
		titleHref: 'https://www.neverin.hr/kamere/',
		aspect: '1280 / 720',
		img: 'https://webcams.neverin.hr/7332072588/latest.jpg'
	},
	{
		id: 'meteoblue-prognoza',
		category: 'prognoza',
		name: 'meteoblue | Prognoza',
		type: 'slideshow',
		eagerSlides: true,
		slides: [
			{
				title: { text: 'meteoblue | Prognoza | Zagreb', href: 'https://www.meteoblue.com/en/weather/week/zagreb_croatia_3186886' },
				img: 'https://meteo-data.jurakovic.workers.dev/meteoblue/meteogram/zagreb.png',
				aspect: '1700 / 1300'
			},
			{
				title: { text: 'meteoblue | Prognoza | Split', href: 'https://www.meteoblue.com/en/weather/week/split_croatia_3190261' },
				img: 'https://meteo-data.jurakovic.workers.dev/meteoblue/meteogram/split.png',
				aspect: '1700 / 1300'
			},
			{
				title: { text: 'meteoblue | Prognoza | Rijeka', href: 'https://www.meteoblue.com/en/weather/week/rijeka_croatia_3191648' },
				img: 'https://meteo-data.jurakovic.workers.dev/meteoblue/meteogram/rijeka.png',
				aspect: '1700 / 1300'
			},
			{
				title: { text: 'meteoblue | Prognoza | Osijek', href: 'https://www.meteoblue.com/en/weather/week/osijek_croatia_3193935' },
				img: 'https://meteo-data.jurakovic.workers.dev/meteoblue/meteogram/osijek.png',
				aspect: '1700 / 1300'
			}
		],
		links: [
			{ text: 'DHMZ', href: 'https://meteo.hr' },
			{ text: 'HRT Vrijeme', href: 'https://vrijeme-i-promet.hrt.hr/vrijeme/' },
			{ text: 'Pljusak', href: 'https://pljusak.com/karta.php' },
			{ text: 'Neverin', href: 'https://www.neverin.hr/prognoza/zagreb/' },
			{ text: 'Yr.no', href: 'https://www.yr.no/en/details/table/2-3186886/Croatia/City%20of%20Zagreb/Zagreb' },
			{ text: 'Wetterzentrale', href: 'https://www.wetterzentrale.de/en/show_diagrams.php?geoid=54032&model=ecm&var=93&run=6&lid=OP&bw=1' }
		]
	},
	{
		id: 'ventusky',
		category: 'radar',
		name: 'Ventusky',
		type: 'iframe',
		frameId: 'ventusky',
		scaled: true,
		loading: 'eager',
		titleHref: 'https://www.ventusky.com/?p=44.5;16.5;6&l=radar&w=off',
		srcHr: 'https://embed.ventusky.com/?p=44.5;16.5;6&l=radar&w=off',
		zoomHrDesktop: ';6&',
		zoomHrMobile: ';6&',
		srcEu: 'https://embed.ventusky.com/?p=48.0;10.0;4&l=radar&w=off',
		zoomEuDesktop: ';4&',
		zoomEuMobile: ';3&',
		links: except(RADAR_HR_LINKS, 'Ventusky')
	},
	{
		id: 'rainviewer',
		category: 'radar',
		name: 'Rain Viewer',
		type: 'iframe',
		frameId: 'rainViewer',
		scaled: true,
		titleHref: 'https://www.rainviewer.com/map.html?loc=44.5,16.5,6&oCS=1&c=5&lm=1&layer=radar&sm=1&sn=2&ts=1',
		srcHr: 'https://www.rainviewer.com/map.html?loc=44.8,16.5,6.3&oCS=1&c=5&lm=1&layer=radar&sm=1&sn=2&ts=1',
		zoomHrDesktop: ',6.3&',
		zoomHrMobile: ',5.8&',
		srcEu: 'https://www.rainviewer.com/map.html?loc=48.0,10.0,4.0&oCS=1&c=5&lm=1&layer=radar&sm=1&sn=2&ts=1',
		zoomEuDesktop: ',4.0&',
		zoomEuMobile: ',3.2&',
		links: except(RADAR_HR_LINKS, 'Rain Viewer')
	},
	{
		id: 'weatherandradar',
		category: 'radar',
		name: 'Vrijeme&Radar',
		type: 'iframe',
		frameId: 'weatherAndRadar',
		scaled: true,
		titleHref: 'https://www.vrijemeradar.hr/vremenski-radar/zagreb/18138691?center=44.5,16.5&zoom=7&layer=wr&tz=Europe%2FZagreb',
		srcHr: 'https://radar.wo-cloud.com/pwa/?center=44.5,16.5&zoom=7.2&tz=Europe/Zagreb&tf=HH:mm&tempunit=celsius&windunit=kph&showShareButton=false&lang=en-US&placemarkName=Zagreb&desktop=true&fadeTop=true',
		zoomHrDesktop: '&zoom=7.2',
		zoomHrMobile: '&zoom=6.8',
		srcEu: 'https://radar.wo-cloud.com/pwa/?center=48.0,10.0&zoom=5.0&tz=Europe/Zagreb&tf=HH:mm&tempunit=celsius&windunit=kph&showShareButton=false&lang=en-US&placemarkName=Zagreb&desktop=true&fadeTop=true',
		zoomEuDesktop: '&zoom=5.0',
		zoomEuMobile: '&zoom=4.0',
		links: except(RADAR_HR_LINKS, 'Vrijeme&Radar')
	},
	{
		id: 'meteo-si',
		category: 'radar',
		name: 'meteo.si',
		type: 'slideshow',
		titleHref: 'https://meteo.arso.gov.si/met/sl/weather/observ/radar/',
		maxWidth: 821,
		aspect: '821 / 660',
		slides: [
			'https://meteo.arso.gov.si/uploads/probase/www/observ/radar/si0-rm-anim.gif?nocache',
			'https://meteo.arso.gov.si/uploads/probase/www/observ/radar/si0-rm.gif?nocache'
		],
		links: RADAR_HR_LINKS
	},
	{
		id: 'idokep-radar-eu',
		category: 'radar',
		name: 'Időkép | Radar | Europa',
		type: 'image',
		titleHref: 'https://www.idokep.eu/ceu/radar',
		maxWidth: 840,
		aspect: '840 / 600',
		img: 'https://www.idokep.eu/terkep/eu/radar.gif',
		links: RADAR_EU_LINKS
	},
	{
		id: 'idokep-satelit-eu',
		category: 'satelit',
		name: 'Időkép | Satelit | Europa',
		type: 'video',
		titleHref: 'https://www.idokep.hu/muhold',
		aspect: '1070 / 713',
		src: 'https://www.idokep.hu/radar/sat-eu.mp4',
		// a video has no image for the letterbox backdrop to take (syncBackdrop),
		// and its frame cannot be read out of a canvas either: the source sends
		// Access-Control-Allow-Origin for idokep.hu alone, so drawImage taints the
		// canvas and crossorigin='anonymous' would stop the video loading at all.
		// One frame, stored here instead. It is scaled to cover and blurred by 14px,
		// which leaves colour and coarse shape and nothing else, so 64x43 at q60 is
		// indistinguishable from the full frame and costs 1.8 kB
		backdrop: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAA0JCgsKCA0LCwsPDg0QFCEVFBISFCgdHhghMCoyMS8qLi00O0tANDhHOS0uQllCR05QVFVUMz9dY1xSYktTVFH/2wBDAQ4PDxQRFCcVFSdRNi42UVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVH/wAARCAArAEADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwBljPoksUEElnNNdFRuYRLgnufvdK1reHR5XKx20qjH3hEMfh81YmgR5hN2UB3MU4OSOK1rGdCGcrsEJHU85JNXzsjkibEIW0t1nk3FBjaAvzGp7u5huNPcSBDGM5IGQR7VkSXQkkhQuqgEuRuwcHnHuKgF5vJjlHlgJ/eyAST+uRUFjNbjhbSVSMboUP8ADjPI/n7e9YOl28+oRbLaGMeXkZZif0rbNkZ1MKTERFAH2nkMMFSD6g/yrQKC0sv3hKqgyzJwSPSjS2orFXTLF7ZZleMFnxuJIC4A6AVoLd2rMqNPGHz3HANZV1qiJuS3XCkgeY3zHp1rLjSaU7IkaRc8HZ+tZuaWhSRV0W6EeiSNISI97HjqRxwPrUltes7mWVwkbHJwOnpisC4l8pIrWNiNo+cH19DVmOOXcipISdu45rUR201zYGEec3y/dG3r0/Q1C1zYXLAxoc/x5XPGMAn1rmLaKdHk8wjBxgZ708aolm22OT94xIIAHyjuTn0qG3eyH0OzsonhgcRwMDuwD656tz29qpalLK141oD5keBuI4JA5wfSoLPWbSzELSSs8jJnezZVR6ZPrVa5v2/tQ3iL8zHofpUTmkkNK5v6Bp0ElqbmVY8lioHbGayNX1O5tr7bGvlhSOCOn+NWYdZj1CGC3s7SaKJZA87qQAvqc+9ZOqyreahIwY5VtrAnPAPGPanJ8sdCoW5veOKy4fIBJ6k1q6c4Vg0gPTj2rIikdhtLEgDIrd0hQ7fMM4Ga1ZmS3juUaKMOZDxkf41nrYXIlZhGgJQrhm4GeDXTQxo0XIzzViOCJraQlBkZqG3ayNVFPVmXpvhjV9T0hpo5VdWUKkbgLjBI4/AfrVe6uHs1jinLpPG4SdMcAAY9OM9fwre0+WWyvES3ldEjj+RdxIXLjOAa5Lxa7ya1PI7Es+/cc9cdKHFMjU1k1ZZLfyIJ08pRghDkE56mmzyzJE1xNOSsQycsTxXJaZzqNuhJ2tIoYZ6810Ws3Ev9nLFlSjNkgoDnr3xUOF3ZmkZaXP/Z',
		links: SAT_EU_LINKS
	},
	{
		id: 'istramet-munje',
		category: 'munje',
		name: 'Istramet | Munje',
		type: 'image',
		titleHref: 'https://www.istramet.hr/radari-munja/',
		maxWidth: 804,
		aspect: '804 / 687',
		img: 'https://www.istramet.hr/wp-content/themes/istramet/img/munje_hr.png',
		links: [
			{ text: 'Blitzortung.org', href: 'https://map.blitzortung.org/#6.5/44.5/16.5' },
			{ text: 'LightningMaps.org', href: 'https://www.lightningmaps.org/?lang=en#m=sen;t=3;s=200;o=0;b=0.00;ts=0;z=7;y=44.5;x=16.5;d=4;dl=6;dc=0;' },
			{ text: 'Neverin', href: 'https://www.neverin.hr/munje/' }
		]
	},
	{
		id: 'blitzortung-karta',
		category: 'munje',
		name: 'Blitzortung.org | Munje | Europa',
		type: 'image',
		titleHref: 'https://www.blitzortung.org/en/historical_maps.php?map=10',
		aspect: '1',
		img: 'https://www.blitzortung.org/Images/image_b_eu.png',
		links: [
			{ text: 'Blitzortung.org', href: 'https://map.blitzortung.org/#6/44.5/16.5' },
			{ text: 'LightningMaps.org', href: 'https://www.lightningmaps.org/?lang=en#m=sen;t=3;s=200;o=0;b=0.00;ts=0;z=5;y=47.5;x=17.5;d=4;dl=6;dc=0;' },
			{ text: 'Neverin', href: 'https://www.neverin.hr/munje/#:~:text=Pojava%20munja%20Europa' }
		]
	},
	{
		id: 'wetterzentrale-temp',
		category: 'temperatura',
		name: 'Wetterzentrale | Temperatura',
		type: 'image',
		titleHref: 'https://www.wetterzentrale.de/en/topkarten.php?map=17&model=ecm&var=5&run=6&time=0&lid=OP&h=1&mv=0&tr=1',
		aspect: '959 / 741',
		img: 'https://www.wetterzentrale.de/en/create_gif.php?model=ECM&member=OP&var=5&map=IT&run=06&speed=250&times=0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47',
		alt: 'Wetterzentrale Temperatura',
		links: TEMP_HR_LINKS
	},
	{
		id: 'dhmz-sinopticka',
		category: 'sinoptika',
		name: 'DHMZ | Sinoptička karta',
		type: 'image',
		titleHref: 'https://meteo.hr/prognoze.php?section=prognoze_model&param=web_fronte_sutra12',
		maxWidth: 720,
		aspect: '1',
		img: 'https://prognoza.hr/web_fronte_sutra12.jpg',
		links: [
			{ text: 'ČHMÚ', href: 'https://intranet.chmi.cz/aktualni-situace/aktualni-stav-pocasi/evropa/synopticka-situace' }
		]
	},
	{
		id: 'dwd-sinopticka',
		category: 'sinoptika',
		name: 'DWD | Sinoptička karta',
		type: 'slideshow',
		titleHref: 'https://www.dwd.de/EN/ourservices/hobbymet_wcharts_europe/hobbyeuropecharts.html',
		maxWidth: 800,
		aspect: '800 / 653',
		slides: [
			'https://www.dwd.de/DWD/wetter/wv_spez/hobbymet/wetterkarten/ico_tkboden_na_v36.png',
			'https://www.dwd.de/DWD/wetter/wv_spez/hobbymet/wetterkarten/ico_tkboden_na_036.png',
			'https://www.dwd.de/DWD/wetter/wv_spez/hobbymet/wetterkarten/ico_tkboden_na_048.png',
			'https://www.dwd.de/DWD/wetter/wv_spez/hobbymet/wetterkarten/ico_tkboden_na_060.png',
			'https://www.dwd.de/DWD/wetter/wv_spez/hobbymet/wetterkarten/ico_tkboden_na_084.png',
			'https://www.dwd.de/DWD/wetter/wv_spez/hobbymet/wetterkarten/ico_tkboden_na_108.png'
		],
		links: [
			{ text: 'ČHMÚ', href: 'https://intranet.chmi.cz/aktualni-situace/aktualni-stav-pocasi/evropa/synopticka-situace' },
			{ text: 'DHMZ', href: 'https://meteo.hr/prognoze.php?section=prognoze_model&param=web_fronte_sutra12' }
		]
	},
	dhmzMrcRadar('puntijarka', 'Puntijarka'),
	dhmzMrcRadar('bilogora', 'Bilogora'),
	dhmzMrcRadar('gradiste', 'Gradište'),
	dhmzMrcRadar('goli', 'Goli'),
	dhmzMrcRadar('debeljak', 'Debeljak'),
	dhmzMrcRadar('uljenje', 'Uljenje')
];

export const CATALOG_BY_ID = new Map(MAP_CATALOG.map(map => [map.id, map]));

// the catalog entry of a map id, null for an id it does not know
/** @param {string} id @returns {CatalogMap | null} */
export function catalogMap(id) {
	return CATALOG_BY_ID.get(id) || null;
}

// the default view: the landing page's list, and the customize page's until
// the user picks another (the preset Osnovno)
export const DEFAULT_MAPS = [
	'neverin-radar-hr', 'neverin-satelit-hr', 'neverin-radar-eu', 'neverin-satelit-eu',
	'windy', 'dhmz-radar', 'meteociel-temp', 'blitzortung', 'essl', 'astorp', 'estofex',
	'eumetnet', 'meteociel-satelit', 'dwd-sinopticka', 'neverin-kamera', 'meteoblue-prognoza'
];
