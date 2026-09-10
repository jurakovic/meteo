// Map catalog, renderer and user preferences (presets + custom pick/order)
// for the customize page. Loaded before main.js; renders maps into
// <tbody data-maps> at parse time so main.js's DOMContentLoaded wiring sees
// the finished DOM. The static landing page does not load this file.

// ---------- shared link groups ----------

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

// ---------- map catalog ----------

const CATEGORY_GLYPHS = {
	radar: '📡',
	satelit: '🛰️',
	munje: '⚡',
	temperatura: '🌡️',
	nevrijeme: '⛈️',
	sinoptika: '🗺️',
	kamera: '📷',
	prognoza: '📈'
};

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

const MAP_CATALOG = [
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
			},
			/*
			{
				title: { text: 'Meteociel.fr | Satelit', href: 'https://www.meteociel.fr/observations-meteo/satellite.php?mode=animation-sandwich-visible-infrarouge-mtg' },
				img: 'https://modeles20.meteociel.fr/satellite/animsatsandvisirmtgeu.gif',
				aspect: '1'
			},
			{
				title: { text: 'Meteociel.fr | Satelit', href: 'https://www.meteociel.fr/observations-meteo/satellite.php?mode=sandwich-visible-infrarouge-mtg' },
				img: 'https://modeles20.meteociel.fr/satellite/latestsatsandvisirmtgeu.png',
				aspect: '1'
			}
			*/
		],
		links: SAT_EU_LINKS
	},
	{
		id: 'chmi-sinopticka',
		category: 'sinoptika',
		name: 'ČHMÚ | Sinoptička karta',
		type: 'slideshow',
		maxWidth: 760,
		// only has an effect on titled slideshows: updateSlideshowWidth (main.js)
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
		links: SAT_EU_LINKS
	},
	/*
	{
		id: 'idokep-radar-adria',
		category: 'radar',
		name: 'Időkép | Radar | Hrvatska',
		type: 'video',
		titleHref: 'https://www.idokep.eu/adria',
		videoClass: 'vid2',
		src: 'https://www.idokep.hu/idokepradar/public_radar_adria.mp4'
	},
	*/
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

// ---------- presets ----------

// default view of the customize page (mirrors the static landing page)
const DEFAULT_MAPS = [
	'neverin-radar-hr', 'neverin-satelit-hr', 'neverin-radar-eu', 'neverin-satelit-eu',
	'windy', 'dhmz-radar', 'meteociel-temp', 'blitzortung', 'essl', 'astorp', 'estofex',
	'eumetnet', 'meteociel-satelit', 'dwd-sinopticka', 'neverin-kamera', 'meteoblue-prognoza'
];

// every preset carries its own id list, so resolving one is a plain lookup
const MAP_PRESETS = [
	// the id stays 'zadano': it is written into saved preferences and shared links
	{ id: 'zadano', name: 'Osnovno', maps: DEFAULT_MAPS },
	{
		id: 'vise', name: 'Više',
		maps: [
			'ventusky', 'rainviewer', 'weatherandradar', 'meteo-si', 'idokep-radar-eu',
			'idokep-satelit-eu', /* 'idokep-radar-adria', */ 'istramet-munje', 'blitzortung-karta', 'wetterzentrale-temp',
			'dhmz-sinopticka', 'chmi-sinopticka', 'dhmz-puntijarka', 'dhmz-bilogora', 'dhmz-gradiste', 'dhmz-goli',
			'dhmz-debeljak', 'dhmz-uljenje'
		]
	},
	{
		id: 'radari', name: 'Radari',
		maps: ['neverin-radar-hr', 'neverin-radar-eu', 'windy', 'dhmz-radar', 'eumetnet', 'ventusky', 'rainviewer', 'weatherandradar', 'meteo-si', 'idokep-radar-eu']
	},
	{
		id: 'sateliti', name: 'Sateliti',
		maps: ['neverin-satelit-hr', 'neverin-satelit-eu', 'meteociel-satelit', 'idokep-satelit-eu']
	},
	{
		id: 'nevrijeme', name: 'Nevrijeme',
		maps: ['essl', 'astorp', 'estofex', 'blitzortung', 'istramet-munje', 'blitzortung-karta']
	},
	{ id: 'sve', name: 'Sve', maps: MAP_CATALOG.map(map => map.id) },
	{ id: 'nista', name: 'Ništa', maps: [] }
];

// ---------- user presets (localStorage) ----------
// Saved views take the same { id, name, maps } shape as the built-ins, so the
// preset bar, presetMapIds and the stored preferences treat both alike. Ids
// are prefixed to keep them out of the built-in namespace, which leaves the
// name free to change — renaming never breaks a saved preference or selection.

const USER_PRESETS_KEY = 'mapUserPresets';
const USER_PRESET_PREFIX = 'u:';
const PRESET_NAME_MAX = 40;

function isUserPresetId(id) {
	return typeof id === 'string' && id.startsWith(USER_PRESET_PREFIX);
}

function isValidPreset(preset) {
	return preset && isUserPresetId(preset.id)
		&& typeof preset.name === 'string' && Array.isArray(preset.maps);
}

function loadUserPresets() {
	try {
		const list = JSON.parse(localStorage.getItem(USER_PRESETS_KEY));
		if (Array.isArray(list)) return list.filter(isValidPreset);
	} catch (e) { /* corrupt storage falls through to none */ }
	return [];
}

// read once: allPresets runs on every validation and panel build
let userPresets = loadUserPresets();

function saveUserPresets() {
	try {
		localStorage.setItem(USER_PRESETS_KEY, JSON.stringify(userPresets));
	} catch (e) { /* storage disabled or full — the presets still work this session */ }
}

function allPresets() {
	return MAP_PRESETS.concat(userPresets);
}

function newPresetId() {
	let id;
	do { id = USER_PRESET_PREFIX + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
	while (userPresets.some(preset => preset.id === id));
	return id;
}

// the name is the handle for overwriting, so it has to stay printable and bounded
function cleanPresetName(name) {
	return String(name).trim().replace(/\s+/g, ' ').slice(0, PRESET_NAME_MAX);
}

function findUserPresetByName(name) {
	return userPresets.find(preset => preset.name.toLowerCase() === name.toLowerCase());
}

// saving under an existing name updates that preset — the way to amend a saved
// view is to edit the list and save it again under the same name. The layout
// (the snapped arrangement, null for none) is part of what is saved: a preset
// is the whole view, and applying it brings the arrangement back
function storeUserPreset(name, maps, layout = null) {
	const existing = findUserPresetByName(name);
	if (existing) {
		existing.name = name;
		existing.maps = maps;
		existing.layout = layout;
	} else {
		userPresets.push({ id: newPresetId(), name: name, maps: maps, layout: layout });
	}
	saveUserPresets();
	return existing || userPresets[userPresets.length - 1];
}

// for a preset arriving from someone else's link, where silently overwriting a
// preset of the recipient's own would lose their list
function uniquePresetName(name) {
	// the budget is spent before the clash is looked up, not after: appending
	// the suffix and slicing back to PRESET_NAME_MAX would hand a full-length
	// name straight back to storeUserPreset, which overwrites by name
	const base = cleanPresetName(name);
	let candidate = base;
	for (let n = 2; findUserPresetByName(candidate); n++) {
		const suffix = ` (${n})`;
		candidate = base.slice(0, PRESET_NAME_MAX - suffix.length).trim() + suffix;
	}
	return candidate;
}

// deleting writes to storage at once, unlike the rest of the panel, which only
// commits on Primijeni — so a saved preference naming this preset has to be
// rewritten in the same breath. Left alone it would fail isValidPrefs on the
// next load and fall back to Osnovno, losing the view still on screen. The
// stored contents are what gets kept, not the panel's possibly-edited list.
function deleteUserPreset(id) {
	const preset = userPresets.find(p => p.id === id);
	if (preset && getMapPrefs().preset === id)
		saveMapPrefs({ preset: 'custom', maps: preset.maps.slice(), layout: getMapPrefs().layout });
	userPresets = userPresets.filter(p => p.id !== id);
	saveUserPresets();
}

// ---------- hidden built-in presets (localStorage) ----------
// Built-ins are code, so they are hidden rather than deleted — and hiding is a
// display choice only. allPresets keeps returning them, so a saved preference,
// the zadano fallback and a shared link naming a preset the recipient hides
// all keep resolving. Only the preset bar filters.

const HIDDEN_PRESETS_KEY = 'mapHiddenPresets';

// one built-in always stays on offer, so the row can never come down to
// "Prilagođeno" alone and there is always a named view to get back to
const PERMANENT_PRESET_ID = 'zadano';

function isHideablePreset(id) {
	return id !== PERMANENT_PRESET_ID;
}

function loadHiddenPresets() {
	try {
		const list = JSON.parse(localStorage.getItem(HIDDEN_PRESETS_KEY));
		// the permanent one is dropped on the way in, so a list stored before it
		// became permanent doesn't keep it hidden or skew the counts below
		if (Array.isArray(list)) return list.filter(id => isHideablePreset(id) && MAP_PRESETS.some(preset => preset.id === id));
	} catch (e) { /* corrupt storage falls through to none hidden */ }
	return [];
}

let hiddenPresets = loadHiddenPresets();

function saveHiddenPresets() {
	try {
		localStorage.setItem(HIDDEN_PRESETS_KEY, JSON.stringify(hiddenPresets));
	} catch (e) { /* storage disabled or full — the choice still holds this session */ }
}

function isPresetHidden(id) {
	return hiddenPresets.includes(id);
}

function setPresetHidden(id, hidden) {
	if (hidden && !isHideablePreset(id)) return; // no row offers this, but the rule lives here
	hiddenPresets = hiddenPresets.filter(hiddenId => hiddenId !== id);
	if (hidden) hiddenPresets.push(id);
	saveHiddenPresets();
}

function hideablePresets() {
	return MAP_PRESETS.filter(preset => isHideablePreset(preset.id));
}

function hideAllPresets() {
	hiddenPresets = hideablePresets().map(preset => preset.id);
	saveHiddenPresets();
}

function showAllPresets() {
	hiddenPresets = [];
	saveHiddenPresets();
}

// what the preset bar offers, as opposed to what still resolves
function visiblePresets() {
	return allPresets().filter(preset => !isPresetHidden(preset.id));
}

// ---------- preferences (localStorage) ----------

const MAP_PREFS_KEY = 'mapPrefs';

// guards both untrusted sources (localStorage, ?v=): 'custom' is a runtime-only
// preset (not in MAP_PRESETS), everything else must name a real preset or it
// can't be selected/rendered — unknown ids (older/newer site version, a deleted
// user preset, hand-crafted ?v=) are rejected so a stale value isn't kept
function isValidPrefs(prefs) {
	return prefs && typeof prefs.preset === 'string'
		&& (prefs.preset === 'custom' || allPresets().some(p => p.id === prefs.preset));
}

function getMapPrefs() {
	try {
		const prefs = JSON.parse(localStorage.getItem(MAP_PREFS_KEY));
		if (isValidPrefs(prefs)) return prefs;
	} catch (e) { /* corrupt storage falls through to default */ }
	return { preset: 'zadano' };
}

function saveMapPrefs(prefs) {
	try {
		localStorage.setItem(MAP_PREFS_KEY, JSON.stringify(prefs));
	} catch (e) { /* storage disabled or full — still apply the view this session */ }
}

function presetMapIds(presetId) {
	const preset = allPresets().find(p => p.id === presetId);
	return preset ? preset.maps : null;
}

function resolveMapIds() {
	return prefsMapIds(getActiveMapPrefs());
}

// the list a preferences object names — deduped as well as filtered: a
// hand-crafted ?v= can name the same map twice, and two rendered copies would
// share one data-slideshow-id (the arrows drive whichever comes first while
// both sets of indicators light up)
function prefsMapIds(prefs) {
	if (prefs.preset === 'custom' && Array.isArray(prefs.maps))
		return [...new Set(prefs.maps)].filter(id => MAP_CATALOG.some(map => map.id === id));
	return presetMapIds(prefs.preset) || presetMapIds('zadano');
}

// ---------- shared view (?v= query parameter) ----------
// A shared link overrides the saved preferences for the session only; the
// parameter is kept in the address bar (re-copyable, refresh-safe) and is
// removed once the user applies their own settings.

// btoa only takes code points up to U+00FF, and a saved preset's name rides
// along in the payload — every Croatian diacritic (č ć š ž đ) is above that.
// Escaping them as \uXXXX first keeps the input ASCII; JSON.parse reads those
// back on its own, so decodeMapView needs no counterpart and links shared by
// an older version (ASCII throughout) still decode unchanged.
function encodeMapView(prefs) {
	const json = JSON.stringify(prefs)
		.replace(/[\u0080-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
	return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeMapView(value) {
	try {
		const prefs = JSON.parse(atob(value.replace(/-/g, '+').replace(/_/g, '/')));
		if (isValidPrefs(prefs)) {
			// a shared saved preset travels as its contents plus its name, which
			// the panel offers to save — it lands in storage, so bound it here
			if (prefs.name) prefs.name = cleanPresetName(prefs.name);
			return prefs;
		}
	} catch (e) { /* malformed parameter falls through */ }
	return null;
}

// a saved preset's id means nothing to a recipient, so it travels as its
// contents plus its name — the name is only a label to save it under
function presetSharePrefs(preset) {
	const prefs = { preset: 'custom', maps: preset.maps.slice(), name: preset.name };
	if (preset.layout) prefs.layout = preset.layout;
	return prefs;
}

// same maps in the same order: the render order is part of what a preset is,
// so a reordered copy is a different view and stays "Prilagođeno"
function sameMapIds(a, b) {
	return a.length === b.length && a.every((id, index) => id === b[index]);
}

// A shared preset arrives without an id (see presetSharePrefs), so the bar has
// nothing to match and falls back to "Prilagođeno" — including when you open
// your own link, where the list is one of your saved presets. Matching on
// contents finds it again. The name is not part of the test: it is a label the
// recipient may already have used for something else, and a renamed preset is
// still the same view. Saved presets are searched before the built-ins, so a
// saved copy of a built-in list selects the copy rather than the original.
function presetIdForMapIds(mapIds) {
	const match = userPresets.concat(MAP_PRESETS).find(preset => sameMapIds(preset.maps, mapIds));
	return match ? match.id : null;
}

// navigator.clipboard only exists in secure contexts (https/localhost), e.g.
// not on http://<LAN-IP>; fall back to a copyable prompt there — and again if
// the write itself is refused (permissions, lost focus)
function copyMapViewLink(prefs, onCopied) {
	const url = new URL(window.location.origin + window.location.pathname);
	url.searchParams.set('v', encodeMapView(prefs));
	const link = url.toString();
	const promptCopy = () => window.prompt('Kopiraj poveznicu:', link);
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(link).then(onCopied).catch(promptCopy);
	} else {
		promptCopy();
	}
}

// confirms a copy in place, since the panel has no other feedback channel
function flashLabel(node, text, restore) {
	node.textContent = text;
	setTimeout(() => { node.textContent = restore; }, 1500);
}

let sharedMapView = (() => {
	const value = new URLSearchParams(window.location.search).get('v');
	return value ? decodeMapView(value) : null;
})();

function getActiveMapPrefs() {
	return sharedMapView || getMapPrefs();
}

// which chip the panel opens on. Only a shared list is matched back to a
// preset: saved preferences hold "custom" because the user applied a list
// without saving it, and binding that to a preset id behind their back would
// hand later edits of that preset to a view that only happens to match today.
function activePresetId() {
	const prefs = getActiveMapPrefs();
	if (sharedMapView && prefs.preset === 'custom') return presetIdForMapIds(resolveMapIds()) || 'custom';
	return prefs.preset;
}

function clearSharedMapView() {
	if (!sharedMapView) return;
	sharedMapView = null;
	const url = new URL(window.location);
	url.searchParams.delete('v');
	history.replaceState(null, '', url);
}

// ---------- rendering ----------

function el(tag, attrs = {}, children = []) {
	const node = document.createElement(tag);
	for (const [key, value] of Object.entries(attrs)) {
		if (value === undefined || value === null || value === false) continue;
		if (key === 'text') node.textContent = value;
		else if (key === 'html') node.innerHTML = value;
		else node.setAttribute(key, value);
	}
	for (const child of children) {
		if (child) node.appendChild(child);
	}
	return node;
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
		popout ? el('span', { class: 'right right-cluster' }, [buildGroupButton(), buildPopoutButton()]) : null
	]);
}

// top-level title bars show the map's picker name; only slide titles
// carry their own text (it differs per slide)
function buildMapTitleBar(map) {
	return buildTitleBar({ text: map.name, href: map.titleHref }, map, true);
}

function buildSlideshow(map) {
	const start = map.startSlide || 1;
	const titled = map.slides.some(slide => slide.title);

	const container = el('div', {
		class: titled ? 'slideshow' : 'slideshow placeholder',
		'data-slideshow-id': map.id,
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

	const prev = el('a', { class: 'prev' + (titled ? ' shorter' : ''), html: '&#10094;' });
	prev.addEventListener('click', () => plusSlides(map.id, -1));
	const next = el('a', { class: 'next' + (titled ? ' shorter' : ''), html: '&#10095;' });
	next.addEventListener('click', () => plusSlides(map.id, 1));
	container.appendChild(prev);
	container.appendChild(next);

	const indicators = el('div', {
		class: 'indicators-container',
		'data-slideshow-id': map.id,
		style: `${maxWidthStyle(map)} grid-template-columns: repeat(${map.slides.length}, 1fr);`.trim()
	});
	map.slides.forEach((slide, i) => {
		indicators.appendChild(el('span', { class: 'indicator' + (i === start - 1 ? ' active' : '') }));
	});

	return [map.titleHref ? buildMapTitleBar(map) : null, container, indicators];
}

function buildImage(map) {
	return [
		buildMapTitleBar(map),
		el('div', { class: 'placeholder', style: `${maxWidthStyle(map)} aspect-ratio: ${map.aspect};`.trim() }, [
			el('img', { src: map.img, alt: map.alt })
		])
	];
}

function buildVideo(map) {
	const video = el('video', { controls: '' }, [el('source', { type: 'video/mp4', src: map.src })]);
	video.muted = true;
	video.autoplay = true;
	video.loop = true;
	// without an aspect the wrapper class (.vid1/.vid2 padding-top) sizes the box
	const style = `${maxWidthStyle(map)}${map.aspect ? ` aspect-ratio: ${map.aspect};` : ''}`.trim();
	return [
		buildMapTitleBar(map),
		el('div', { class: 'placeholder', style: style || undefined }, [
			el('div', { class: map.videoClass || 'vid1' }, [video])
		])
	];
}

function buildIframe(map) {
	const frameId = map.frameId;
	const pascal = frameId[0].toUpperCase() + frameId.slice(1);

	const zoomBtn = el('a', { class: 'left zoom-btn', 'data-mode': 'hr', text: '[HR]' });
	zoomBtn.addEventListener('click', () => switchIframeZoom(frameId, zoomBtn));
	const fsBtn = el('a', { class: 'fs-btn', text: '[ ]' });
	fsBtn.addEventListener('click', () => toggleFullscreen(frameId, fsBtn));

	const title = el('div', { class: 'radartitle' }, [
		zoomBtn,
		el('a', { class: 'center', href: map.titleHref, target: '_blank', rel: 'nofollow', text: map.name }),
		el('span', { class: 'right right-cluster' }, [
			buildGroupButton(),
			buildPopoutButton(),
			el('a', { id: `reset${pascal}Frame`, 'data-frame-id': frameId, style: 'display:none', text: '[X]' }),
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

function buildBasicIframe(map) {
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

function buildMapContent(map) {
	switch (map.type) {
		case 'slideshow': return buildSlideshow(map);
		case 'image': return buildImage(map);
		case 'video': return buildVideo(map);
		case 'iframe': return buildIframe(map);
		case 'iframe-basic': return buildBasicIframe(map);
	}
	return [];
}

function renderMaps() {
	const tbody = document.querySelector('tbody[data-maps]');
	if (!tbody) return;
	resetSnapColumns(); // their panes go with the tbody
	tbody.replaceChildren();
	const maps = resolveMapIds().map(id => MAP_CATALOG.find(m => m.id === id)).filter(Boolean);
	if (!maps.length) {
		tbody.appendChild(el('tr', {}, [
			el('td', { align: 'center' }, [
				el('div', { class: 'maps-empty', text: 'Nema odabranih karata. Odaberite ih pod "Karte".' })
			])
		]));
		return;
	}
	maps.forEach((map, i) => {
		if (i > 0) tbody.appendChild(el('tr', { class: 'sp20' }));
		// one block per map so the pop-out can lift title, map and indicators together
		const block = el('div', { class: 'map-block', 'data-map-id': map.id }, buildMapContent(map));
		tbody.appendChild(el('tr', {}, [el('td', { align: 'center' }, [block])]));
		if (map.links && map.links.length) {
			tbody.appendChild(el('tr', {}, [el('td', { align: 'center' }, [buildLinksBottom(map)])]));
		}
	});
}

// ---------- pop-out (desktop) ----------

// a map block lifted out of the page into a fixed, draggable, resizable widget
// so it stays visible while the rest of the page scrolls. Nothing moves in the
// DOM (an iframe would reload): the block only gets a class and inline
// left/top/width, the same trick as the iframe fullscreen. A spacer of the
// block's height keeps its place in the table and offers a way back.
// Desktop only — the button is hidden by the same media query in CSS.
const POPOUT_MQ = window.matchMedia('(min-width: 801px) and (hover: hover) and (pointer: fine)');
const POPOUT_WIDTH = 420;
const POPOUT_MIN_WIDTH = 260;
const POPOUT_MAX_WIDTH = 875; // the table's max-width
const POPOUT_MIN_HEIGHT = 120; // free (iframe) widgets only; the others follow their aspect
const POPOUT_MARGIN = 16; // kept free of the viewport edge when sizing
const POPOUT_TITLE_HEIGHT = 23; // .radartitle height; keeps the drag handle reachable
const POPOUT_HANDLES = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
const MAGNET = 12; // a dragged widget's edge this close to another floating widget's is pulled onto it
const GROUP_TOUCH = 1; // widgets whose edges lie this close on each other touch, and can be grouped
let popoutZ = 5000; // bumped on every raise so the last touched widget is on top
const POPOUT_FS_Z = 4500; // a widget hosting a fullscreen map: under every other widget, over the columns' ground (CSS puts the page's fullscreen there too)

function buildPopoutButton() {
	const btn = el('a', { class: 'po-btn' });
	btn.addEventListener('click', () => togglePopout(btn.closest('.map-block')));
	setPopoutButton(btn, false);
	return btn;
}

function setPopoutButton(btn, popped) {
	// ASCII only: an arrow glyph comes from a fallback font and sits off the baseline of [ ] and [X]
	btn.textContent = popped ? '[=]' : '[^]';
	btn.title = popped ? 'Vrati kartu na stranicu' : 'Izdvoji kartu u pomični prozor';
}

function togglePopout(block) {
	if (!block) return;
	if (block.classList.contains('popout')) dockMap(block);
	else if (POPOUT_MQ.matches) popoutMap(block);
}

function popoutMap(block) {
	dlog(`popoutMap: ${block.dataset.mapId}`);
	const rect = block.getBoundingClientRect();
	const back = el('a', { text: 'Vrati' });
	back.addEventListener('click', () => dockMap(block));
	const gap = el('div', { class: 'map-gap', style: `height: ${rect.height}px;` }, [
		el('span', { text: 'Karta je izdvojena u prozor ·' }),
		back
	]);
	block._gap = gap;
	block.after(gap);
	block.classList.add('popout');
	block.style.width = `${Math.min(POPOUT_WIDTH, rect.width)}px`;
	// an interactive map is sized freely in both dimensions: it starts at the
	// height its aspect gives it at this width, then the block takes over from
	// the .if1/.if2 padding (.free lays it out as a column, the map fills)
	if (isFreePopout(block)) {
		block.style.height = `${block.offsetHeight}px`;
		block.classList.add('free');
	}
	POPOUT_HANDLES.forEach(dir => block.appendChild(el('div', { class: `po-h po-h-${dir}`, 'data-dir': dir })));
	// stays where it was on screen, so it reads as lifted rather than teleported
	placePopout(block, rect.left, rect.top);
	raisePopout(block);
	block.querySelectorAll('.po-btn').forEach(btn => setPopoutButton(btn, true));
	persistSnapLayout();
}

// iframes have no intrinsic aspect, so their widgets resize in both dimensions;
// images, slideshows and videos keep the height their aspect ratio gives them
function isFreePopout(block) {
	return !!block.querySelector('.if1, .if2');
}

function dockMap(block) {
	dlog(`dockMap: ${block.dataset.mapId}`);
	// a fullscreen iframe inside the widget is fixed on its own; take it down first
	const fs = block.querySelector('.if1.fullscreen');
	if (fs) exitFullscreen(fs);
	if (block._group) leaveGroup(block);
	unsnapPane(block);
	block.classList.remove('popout', 'free', 'grouped');
	['left', 'top', 'width', 'height', 'z-index'].forEach(p => block.style.removeProperty(p));
	block.querySelectorAll('.po-h').forEach(h => h.remove());
	if (block._gap) block._gap.remove();
	delete block._gap;
	block.querySelectorAll('.po-btn').forEach(btn => setPopoutButton(btn, false));
	persistSnapLayout();
}

function dockAllPopouts() {
	document.querySelectorAll('.map-block.popout').forEach(dockMap);
}

// keep the whole widget inside the viewport when it fits, else at least its
// top-left corner so the title bar can always be grabbed
function placePopout(block, left, top) {
	const maxLeft = Math.max(0, viewportWidth() - block.offsetWidth);
	const maxTop = Math.max(0, viewportHeight() - Math.max(block.offsetHeight, POPOUT_TITLE_HEIGHT));
	block.style.left = `${Math.round(Math.min(Math.max(0, left), maxLeft))}px`;
	block.style.top = `${Math.round(Math.min(Math.max(0, top), maxTop))}px`;
}

// a grouped widget comes up with its group, the order within it kept
function raisePopout(block) {
	groupMembers(block)
		.sort((a, b) => (Number(a.style.zIndex) || 0) - (Number(b.style.zIndex) || 0))
		.forEach(member => member.style.zIndex = ++popoutZ);
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), Math.max(min, max));
}

// the layout viewport: innerWidth counts the vertical scrollbar, under which
// a widget's right edge (and a right column) would then land
function viewportWidth() {
	return document.documentElement.clientWidth;
}

function viewportHeight() {
	return document.documentElement.clientHeight;
}

// a pointer gesture on a widget: move/up listeners on document (mouse only,
// nothing moves in the DOM — compare the picker drag in the settings panel),
// and .po-dragging turns iframe pointer events off so the pointer is not
// swallowed when it crosses one mid-gesture. onEnd runs once the pointer is
// released (or the gesture cancelled)
function trackPopoutPointer(e, onMove, onEnd) {
	const startX = e.clientX, startY = e.clientY;
	const move = (ev) => onMove(ev.clientX - startX, ev.clientY - startY, ev);
	const stop = () => {
		document.removeEventListener('pointermove', move);
		document.removeEventListener('pointerup', stop);
		document.removeEventListener('pointercancel', stop);
		document.body.classList.remove('po-dragging');
		if (onEnd) onEnd();
	};
	document.body.classList.add('po-dragging');
	document.addEventListener('pointermove', move);
	document.addEventListener('pointerup', stop);
	document.addEventListener('pointercancel', stop);
}

// the widget follows the pointer by the point of the title bar it was grabbed
// at. Once its edge reaches a viewport edge (wherever it is held — the place
// the pointer asks for is checked, not the clamped one, so pushing on past
// the edge still counts) it has a snap slot, previewed and taken on release.
// A snapped pane moves up and down its column until the drag is decidedly
// sideways, then floats again as it stood, the title bar kept under the
// pointer. Away from the viewport edges the other floating widgets are
// magnets: an edge brought close to one of theirs is pulled onto it. A
// grouped widget takes its group along: the members move by one offset, and
// the magnets, the viewport and the column snap see the group's bounding
// box in place of the widget held
function dragPopout(block, e) {
	let rect = block.getBoundingClientRect();
	const grab = { x: e.clientX - rect.left, y: e.clientY - rect.top };
	const members = groupMembers(block); // the widget alone when not grouped
	let starts = groupStarts(members), box = groupBox(starts);
	let col = snapColumnOf(block); // a group's members share it
	const magnets = magnetRects(block, members); // the others stay put for the drag
	let target = null;
	trackPopoutPointer(e, (dx, dy, ev) => {
		// a click on a parked widget must not move, snap or be pulled anywhere
		const armed = Math.hypot(dx, dy) >= SNAP_ARM;
		if (col) {
			if (Math.abs(dx) < SNAP_DETACH) {
				if (armed) movePanes(col, starts, box, dy);
				return;
			}
			// out of the column: the members float where they stand, measured
			// afresh, the title bar kept under the pointer
			members.forEach(unsnapPane);
			col = null;
			rect = block.getBoundingClientRect();
			grab.x = Math.min(grab.x, block.offsetWidth - POPOUT_TITLE_HEIGHT);
			grab.y = clamp(ev.clientY - rect.top, 0, POPOUT_TITLE_HEIGHT);
			starts = groupStarts(members);
			box = groupBox(starts);
		}
		// where the box is asked to go, off the widget held
		let boxLeft = box.left + ev.clientX - grab.x - rect.left, boxTop = box.top + ev.clientY - grab.y - rect.top;
		const side = armed ? snapSideAt(boxLeft, boxLeft + box.width) : null;
		target = side ? { side, slot: snapSlot(members, side, boxTop) } : null;
		if (armed && !target) ({ left: boxLeft, top: boxTop } = magnetPosition(magnets, boxLeft, boxTop, box.width, box.height));
		moveGroup(starts, box, boxLeft - box.left, boxTop - box.top);
		showSnapPreview(target ? target.slot : null);
	}, () => {
		showSnapPreview(null);
		if (target) snapPanes(byPlace(members), target.side, target.slot);
		else persistSnapLayout();
	});
}

// top to bottom, then left to right: the order a stack is made in
function byPlace(blocks) {
	return [...blocks].sort((a, b) => {
		const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
		return ra.top - rb.top || ra.left - rb.left;
	});
}

// the widgets floating over the page other than this one and the others
// moving with it — a pane is out of reach in its column, and a widget hosting
// a fullscreen map is not to be seen
function magnetRects(block, along = []) {
	return floatingBlocks()
		.filter(other => other !== block && !along.includes(other) && !other.classList.contains('fs-host'))
		.map(other => other.getBoundingClientRect());
}

// where a widget of this size asked to left/top is pulled to. An edge within
// MAGNET of another widget's opposite edge meets it — beside it when the two
// overlap in height, above or below it when they overlap in width — and once
// they meet on one axis the nearer of the like edges lines up on the other,
// so a widget dropped below another sits flush with its left or right side.
// The closest edge wins on each axis; nothing within reach leaves the widget
// where it was asked
function magnetPosition(rects, left, top, width, height) {
	const right = left + width, bottom = top + height;
	// the candidate carrying the closest edge within reach, with its widget
	const pull = (value, candidates) => {
		const edge = magnetEdge(value, candidates.map(c => c[0]));
		return edge === null ? null : candidates.find(c => c[0] === edge);
	};
	const beside = rects.filter(r => top < r.bottom && bottom > r.top);
	const stacked = rects.filter(r => left < r.right && right > r.left);
	let x = pull(left, beside.flatMap(r => [[r.right, r], [r.left - width, r]]));
	let y = pull(top, stacked.flatMap(r => [[r.bottom, r], [r.top - height, r]]));
	if (x && !y) y = pull(top, [[x[1].top, x[1]], [x[1].bottom - height, x[1]]]);
	if (y && !x) x = pull(left, [[y[1].left, y[1]], [y[1].right - width, y[1]]]);
	return { left: x ? x[0] : left, top: y ? y[0] : top };
}

// the closest of the edges within MAGNET of value, null when none is
function magnetEdge(value, edges) {
	let best = null;
	edges.forEach(edge => {
		if (Math.abs(edge - value) <= MAGNET && (best === null || Math.abs(edge - value) < Math.abs(best - value))) best = edge;
	});
	return best;
}

// ---------- groups ----------

// widgets that touch (an edge of one on an edge of the other, the two
// overlapping along it — what the magnets leave) can be grouped: the group
// drags and raises as one, each member still resizes on its own. The title
// bar's [+] joins a widget with what it touches (and their groups, into
// one), [-] takes it out again; a group left with one member is no group.
// Explicit only: touching alone groups nothing. Widgets touch in one place —
// floating over the page, or panes of the same column — so a group is always
// in one place, and goes into or out of a column as one. A group lives in
// block._group (an id shared by its members) and rides in the stored layout
// as a group number on each member's entry. Docking a member takes it out.
let groupSeq = 0;

function allPopouts() {
	return [...document.querySelectorAll('.map-block.popout')];
}

function floatingBlocks() {
	return [...document.querySelectorAll('.map-block.popout:not(.snapped)')];
}

function groupMembers(block) {
	return block._group ? allPopouts().filter(b => b._group === block._group) : [block];
}

// the widgets a block can touch: the others in its place
function placeMates(block) {
	const col = snapColumnOf(block);
	return (col ? col.panes.map(p => p.block) : floatingBlocks()).filter(other => other !== block);
}

function buildGroupButton() {
	const btn = el('a', { class: 'grp-btn', hidden: '' });
	btn.addEventListener('click', () => toggleGroup(btn.closest('.map-block')));
	return btn;
}

function toggleGroup(block) {
	if (!block || !block.classList.contains('popout')) return;
	if (block._group) leaveGroup(block);
	else joinGroup(block);
	persistSnapLayout();
}

function rectsTouch(a, b) {
	const alongY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0;
	const alongX = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0;
	const near = (p, q) => Math.abs(p - q) <= GROUP_TOUCH;
	return (alongY && (near(a.right, b.left) || near(a.left, b.right)))
		|| (alongX && (near(a.bottom, b.top) || near(a.top, b.bottom)));
}

function touchingBlocks(block) {
	const rect = block.getBoundingClientRect();
	return placeMates(block).filter(other =>
		!other.classList.contains('fs-host') && rectsTouch(rect, other.getBoundingClientRect()));
}

function joinGroup(block) {
	dlog(`joinGroup: ${block.dataset.mapId}`);
	const touched = touchingBlocks(block);
	if (!touched.length) return;
	// one group out of the widget, what it touches and the groups those are in
	const ids = new Set(touched.map(b => b._group).filter(Boolean));
	const id = ids.values().next().value || `g${++groupSeq}`;
	allPopouts().forEach(b => { if (b._group && ids.has(b._group)) b._group = id; });
	touched.forEach(b => b._group = id);
	block._group = id;
	updateGroups();
}

function leaveGroup(block) {
	dlog(`leaveGroup: ${block.dataset.mapId}`);
	const id = block._group;
	delete block._group;
	const rest = allPopouts().filter(b => b._group === id);
	if (rest.length < 2) rest.forEach(b => delete b._group);
	updateGroups();
}

// the grouped mark and the button on every widget: [-] on a member, [+] on a
// widget touching another, nothing where there is nothing to do
function updateGroups() {
	allPopouts().forEach(block => {
		const grouped = !!block._group;
		block.classList.toggle('grouped', grouped);
		const can = grouped || touchingBlocks(block).length > 0;
		block.querySelectorAll('.grp-btn').forEach(btn => {
			btn.hidden = !can;
			btn.textContent = grouped ? '[-]' : '[+]';
			btn.title = grouped ? 'Odvoji prozor od skupine' : 'Spoji prozor s prozorima koje dodiruje';
		});
	});
}

// where the members stand, to move them from
function groupStarts(members) {
	return members.map(block => {
		const rect = block.getBoundingClientRect();
		return { block, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
	});
}

function groupBox(starts) {
	const left = Math.min(...starts.map(s => s.left)), top = Math.min(...starts.map(s => s.top));
	const right = Math.max(...starts.map(s => s.right)), bottom = Math.max(...starts.map(s => s.bottom));
	return { left, top, width: right - left, height: bottom - top };
}

// the members moved by one offset, the group's box kept inside the viewport
// when it fits, else at least its top-left corner — placePopout()'s rule
function moveGroup(starts, box, dx, dy) {
	const left = Math.min(Math.max(0, box.left + dx), Math.max(0, viewportWidth() - box.width));
	const top = Math.min(Math.max(0, box.top + dy), Math.max(0, viewportHeight() - box.height));
	dx = Math.round(left - box.left);
	dy = Math.round(top - box.top);
	starts.forEach(s => {
		s.block.style.left = `${Math.round(s.left + dx)}px`;
		s.block.style.top = `${Math.round(s.top + dy)}px`;
	});
}

// resizing from any side or corner. Width is the dimension every widget has;
// a locked (aspect) widget derives its height from it, so a pull on its top or
// bottom edge is turned into the width that gives that height, and a corner
// follows whichever axis asks for more. Pulling the left or top edge keeps the
// opposite edge where it is by moving the widget along. The pulled edge is
// drawn by the other floating widgets too (magnets, as on drag): onto the
// facing edge of one beside it — above or below it, for a top or bottom edge
// — or into line with the like edge of one above or below it; exact for a
// width, and through the aspect ratio for a locked widget's height — whose
// width, once the height has asked for it, has a moving edge of its own to
// pull, so the widget lines up with the one above it by that edge too. A
// free pane in a column keeps the column's width: its top or bottom edge is
// drawn to the column's ends and the other panes, and the top it carries
// follows. A grouped widget's handles resize the whole group (resizeGroup)
function resizePopout(block, dir, e) {
	const members = groupMembers(block);
	const col = snapColumnOf(block);
	if (members.length > 1 && !col) return resizeGroup(members, dir, e);
	const start = block.getBoundingClientRect();
	const free = block.classList.contains('free');
	const ratio = start.width / start.height;
	const maxWidth = Math.min(POPOUT_MAX_WIDTH, viewportWidth() - POPOUT_MARGIN);
	const maxHeight = viewportHeight() - POPOUT_MARGIN;
	const magnets = col ? [] : magnetRects(block);
	trackPopoutPointer(e, (dx, dy) => {
		let w = start.width, h = start.height;
		if (dir.includes('e')) w = start.width + dx;
		if (dir.includes('w')) w = start.width - dx;
		if (dir.includes('s')) h = start.height + dy;
		if (dir.includes('n')) h = start.height - dy;
		if (col) {
			const edges = paneMagnetEdges(col, [block]);
			if (dir.includes('s')) { const m = magnetEdge(start.top + h, edges); if (m !== null) h = m - start.top; }
			if (dir.includes('n')) { const m = magnetEdge(start.bottom - h, edges); if (m !== null) h = start.bottom - m; }
			h = clamp(h, POPOUT_MIN_HEIGHT, viewportHeight());
			const pane = snapPaneOf(block);
			pane.height = h / viewportHeight();
			pane.top = (dir.includes('n') ? start.bottom - h : start.top) / viewportHeight();
			layoutSnapColumns();
			return;
		}
		({ w, h } = pullResizeEdges(magnets, dir, start, w, h));
		if (free) {
			w = clamp(w, POPOUT_MIN_WIDTH, maxWidth);
			h = clamp(h, POPOUT_MIN_HEIGHT, maxHeight);
			block.style.height = `${Math.round(h)}px`;
		} else {
			if (dir === 'n' || dir === 's') w = h * ratio;
			else if (dir.length === 2) w = Math.max(w, h * ratio);
			// the width the height asked for moves the right edge (the left, pulled from the west)
			if (!(dir.includes('e') || dir.includes('w')) || dir.length === 2)
				w = pullResizeEdges(magnets, dir.includes('w') ? 'w' : 'e', start, w, h).w;
			w = clamp(w, POPOUT_MIN_WIDTH, maxWidth);
		}
		block.style.width = `${Math.round(w)}px`;
		// the laid-out height, exact for locked widgets where it follows the width
		h = block.offsetHeight;
		placePopout(block, dir.includes('w') ? start.right - w : start.left, dir.includes('n') ? start.bottom - h : start.top);
	}, persistSnapLayout);
}

// the pulled edges of something that started as start (left/top/right/
// bottom) and is asked to be w by h, drawn by the magnets: onto the facing
// edge of a widget beside it (above or below it, for a top or bottom edge)
// or into line with the like edge of one above or below it (beside it, for a
// top or bottom edge)
function pullResizeEdges(magnets, dir, start, w, h) {
	const left = dir.includes('w') ? start.right - w : start.left;
	const top = dir.includes('n') ? start.bottom - h : start.top;
	const beside = magnets.filter(r => top < r.bottom && top + h > r.top);
	const stacked = magnets.filter(r => left < r.right && left + w > r.left);
	const edge = (value, meet, align) => { const m = magnetEdge(value, meet.concat(align)); return m === null ? value : m; };
	if (dir.includes('e')) w = edge(start.left + w, beside.map(r => r.left), stacked.map(r => r.right)) - start.left;
	if (dir.includes('w')) w = start.right - edge(start.right - w, beside.map(r => r.right), stacked.map(r => r.left));
	if (dir.includes('s')) h = edge(start.top + h, stacked.map(r => r.top), beside.map(r => r.bottom)) - start.top;
	if (dir.includes('n')) h = start.bottom - edge(start.bottom - h, stacked.map(r => r.bottom), beside.map(r => r.top));
	return { w, h };
}

// a group resizes as one thing: its box is pulled as a locked widget's is —
// one scale for the whole, from the pulled axis, a corner following whichever
// asks for more — from the edge or corner opposite the one pulled, the other
// widgets its magnets. Every member is scaled by it (a free one in height
// too; a locked one's height follows its width, with the title bar not
// scaling along), then placed at its scaled offset and settled onto the
// members it touched or lined up with before (groupRelations), so a stack
// stays a stack whatever the title bars do
function resizeGroup(members, dir, e) {
	const starts = groupStarts(members);
	starts.forEach(s => {
		s.width = s.right - s.left;
		s.height = s.bottom - s.top;
		s.free = s.block.classList.contains('free');
	});
	const box = groupBox(starts);
	box.right = box.left + box.width;
	box.bottom = box.top + box.height;
	const relations = groupRelations(starts);
	const order = [...starts].sort((a, b) => a.top - b.top || a.left - b.left);
	const magnets = magnetRects(members[0], members);
	// the anchor: the box grows from the edge or corner opposite the one pulled
	const ax = dir.includes('w') ? box.right : box.left;
	const ay = dir.includes('n') ? box.bottom : box.top;
	// no member under its minimum or over the widest a widget may be, and the box inside the viewport
	const minScale = Math.max(
		POPOUT_MIN_WIDTH / Math.min(...starts.map(s => s.width)),
		...starts.filter(s => s.free).map(s => POPOUT_MIN_HEIGHT / s.height));
	const maxScale = Math.min(
		POPOUT_MAX_WIDTH / Math.max(...starts.map(s => s.width)),
		(dir.includes('w') ? box.right : viewportWidth() - box.left) / box.width,
		(dir.includes('n') ? box.bottom : viewportHeight() - box.top) / box.height);
	trackPopoutPointer(e, (dx, dy) => {
		let w = box.width, h = box.height;
		if (dir.includes('e')) w = box.width + dx;
		if (dir.includes('w')) w = box.width - dx;
		if (dir.includes('s')) h = box.height + dy;
		if (dir.includes('n')) h = box.height - dy;
		({ w, h } = pullResizeEdges(magnets, dir, box, w, h));
		let scale = dir === 'n' || dir === 's' ? h / box.height
			: dir.length === 2 ? Math.max(w / box.width, h / box.height)
			: w / box.width;
		scale = clamp(scale, minScale, Math.max(minScale, maxScale));
		starts.forEach(s => {
			s.block.style.width = `${Math.round(s.width * scale)}px`;
			if (s.free) s.block.style.height = `${Math.round(s.height * scale)}px`;
		});
		const placed = [];
		order.forEach(s => {
			let left = ax + (s.left - ax) * scale, top = ay + (s.top - ay) * scale;
			const width = s.block.offsetWidth, height = s.block.offsetHeight;
			relations.filter(r => r.to === s && placed.includes(r.from)).forEach(r => {
				const a = r.from.block.getBoundingClientRect();
				if (r.kind === 'below') top = a.bottom;
				else if (r.kind === 'above') top = a.top - height;
				else if (r.kind === 'right') left = a.right;
				else if (r.kind === 'left') left = a.left - width;
				else if (r.kind === 'alignLeft') left = a.left;
				else if (r.kind === 'alignRight') left = a.right - width;
				else if (r.kind === 'alignTop') top = a.top;
				else if (r.kind === 'alignBottom') top = a.bottom - height;
			});
			s.block.style.left = `${Math.round(left)}px`;
			s.block.style.top = `${Math.round(top)}px`;
			placed.push(s);
		});
	}, persistSnapLayout);
}

// how the members stand to one another: for every ordered pair that touches,
// which edge of `to` lies on which of `from` (below: to's top on from's
// bottom, and so on), and, along that edge, which like edges line up. The
// alignments come first, the touch last, so it wins where both pull one axis
function groupRelations(starts) {
	const near = (p, q) => Math.abs(p - q) <= GROUP_TOUCH;
	const relations = [];
	starts.forEach(from => starts.forEach(to => {
		if (from === to) return;
		const alongX = Math.min(from.right, to.right) - Math.max(from.left, to.left) > 0;
		const alongY = Math.min(from.bottom, to.bottom) - Math.max(from.top, to.top) > 0;
		const stacked = alongX && (near(to.top, from.bottom) || near(to.bottom, from.top));
		const beside = alongY && (near(to.left, from.right) || near(to.right, from.left));
		if (stacked) {
			if (near(to.left, from.left)) relations.push({ from, to, kind: 'alignLeft' });
			if (near(to.right, from.right)) relations.push({ from, to, kind: 'alignRight' });
			relations.push({ from, to, kind: near(to.top, from.bottom) ? 'below' : 'above' });
		}
		if (beside) {
			if (near(to.top, from.top)) relations.push({ from, to, kind: 'alignTop' });
			if (near(to.bottom, from.bottom)) relations.push({ from, to, kind: 'alignBottom' });
			relations.push({ from, to, kind: near(to.left, from.right) ? 'right' : 'left' });
		}
	}));
	return relations;
}

document.addEventListener('pointerdown', (e) => {
	const snapHandle = e.target.closest('.snap-edge');
	if (snapHandle) {
		if (e.button !== 0) return;
		e.preventDefault();
		snapHandlePointerDown(snapHandle, e);
		return;
	}
	const block = e.target.closest('.map-block.popout');
	if (!block) return;
	// a widget hosting a fullscreen map stays under the others (see map-fullscreen)
	if (!block.classList.contains('fs-host')) raisePopout(block);
	if (e.button !== 0) return;
	const handle = e.target.closest('.po-h');
	const title = e.target.closest('.radartitle');
	// links and buttons keep working; a fullscreen bar is pinned, not a handle
	if (!handle && (!title || e.target.closest('a') || title.classList.contains('fullscreen'))) return;
	// also suppresses the compatibility mousedown, so a slide title bar drag
	// cannot register as a swipe on the slideshow around it
	e.preventDefault();
	if (handle) resizePopout(block, handle.dataset.dir, e);
	else dragPopout(block, e);
});

// widgets are a desktop thing: shrinking below the breakpoint puts them back
POPOUT_MQ.addEventListener('change', (e) => {
	if (e.matches) return;
	snapPersistPaused = true; // the stored arrangement is kept for a desktop window
	dockAllPopouts();
	snapPersistPaused = false;
});

// a smaller window must not strand a widget off-screen
window.addEventListener('resize', () => {
	clearTimeout(window._popoutResizeTimeout);
	window._popoutResizeTimeout = setTimeout(() => {
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
	}, 200);
});

// ---------- snap columns (desktop) ----------

// a widget dragged to the left or right edge of the viewport snaps into a
// column there: a strip of the viewport's height in which panes sit freely
// one above another, the page laid out in what is left between the columns
// (body padding, through --snap-l/--snap-r). A pane is still a pop-out
// widget — same block, same fixed positioning, nothing moves in the DOM —
// only its width is the column's and its place comes from
// layoutSnapColumns(): a column has a width and each pane a top (a free pane
// a height too), all fractions of the viewport so a window resize keeps the
// proportions. Up and down the column a pane moves as a widget does over the
// page, the column's ends and the other panes its magnets; pulled sideways
// it floats again. The column's inner edge is its resize handle (.snap-ui,
// above the panes); .snap-col paints the column's ground below them. A free
// (iframe) pane keeps its own height and resizes by its top and bottom edge;
// a locked one takes the column's width, pulled in to what its content
// spans, and the height that gives it.
//
// The columns can take the whole width — two of them meeting, or one at full
// width — which hides the page (body.snap-full also drops its scrollbar). An
// edge dragged that close snaps shut; a double-click on an edge shuts it too,
// or opens it back to the widths from before. Two columns that meet share one
// seam handle that moves width between them.
const SNAP_EDGE = 5; // a widget edge this close to a viewport edge targets its column
const SNAP_SHUT = 24; // a column edge this close to the far side shuts the page
const SNAP_DETACH = 40; // sideways drag distance before a snapped pane floats again
const SNAP_ARM = 4; // drag distance before a floating widget can snap (a click on a parked widget must not)
const SNAP_MIN_WIDTH = POPOUT_MIN_WIDTH;
const snapColumns = {
	left: { side: 'left', width: null, panes: [], node: null, ui: null },
	right: { side: 'right', width: null, panes: [], node: null, ui: null }
};
let snapPreview = null;
let snapPageWidths = null; // the column widths before the page was hidden, for the way back

function isSnapped(block) {
	return block.classList.contains('snapped');
}

function snapColumnOf(block) {
	return Object.values(snapColumns).find(col => col.panes.some(p => p.block === block)) || null;
}

function snapPaneOf(block) {
	const col = snapColumnOf(block);
	return col ? col.panes.find(p => p.block === block) : null;
}

function otherSnapColumn(col) {
	return col.side === 'left' ? snapColumns.right : snapColumns.left;
}

function snapColumnWidth(col) {
	return col.panes.length ? col.width : 0;
}

function snapColumnPx(col) {
	return Math.round(snapColumnWidth(col) * viewportWidth());
}

// the columns leave the page no width (a rounding hair short of it counts)
function isSnapPageHidden() {
	return snapColumnWidth(snapColumns.left) + snapColumnWidth(snapColumns.right) >= 0.999;
}

// the column something spanning left..right is at: the one whose viewport
// edge its own edge has reached, if any
function snapSideAt(left, right) {
	return left <= SNAP_EDGE ? 'left' : right >= viewportWidth() - SNAP_EDGE ? 'right' : null;
}

// the edges a pane's top or bottom is drawn to in its column: the column's
// ends and the other panes' tops and bottoms (every pane spans the column, so
// all of them are in reach), the blocks given left out
function paneMagnetEdges(col, exclude = []) {
	const edges = [0, viewportHeight()];
	col.panes.forEach(p => {
		if (exclude.includes(p.block) || p.block.classList.contains('fs-host')) return;
		const rect = p.block.getBoundingClientRect();
		edges.push(rect.top, rect.bottom);
	});
	return edges;
}

// a top for something of this height in the column: pulled onto an edge by
// its top or its bottom, then held inside the viewport
function paneTop(col, top, height, exclude = []) {
	const edges = paneMagnetEdges(col, exclude);
	const pulled = magnetEdge(top, edges.concat(edges.map(edge => edge - height)));
	return clamp(pulled === null ? top : pulled, 0, Math.max(0, viewportHeight() - height));
}

// the slot blocks dropped at side would take, the top their box asks for:
// the column's width (a new column takes the box's own, held to what the
// other column leaves) and the height the blocks stack to at that width — a
// free one keeps its height, a locked one's follows the width
function snapSlot(blocks, side, boxTop) {
	const col = snapColumns[side];
	const boxWidth = Math.max(...blocks.map(b => b.offsetWidth));
	const width = col.panes.length
		? snapColumnPx(col)
		: clamp(boxWidth, SNAP_MIN_WIDTH, viewportWidth() - snapColumnPx(otherSnapColumn(col)));
	const height = blocks.reduce((sum, b) =>
		sum + (b.classList.contains('free') ? b.offsetHeight : Math.round(b.offsetHeight * width / b.offsetWidth)), 0);
	return {
		left: side === 'left' ? 0 : viewportWidth() - width,
		top: Math.round(paneTop(col, boxTop, height, blocks)),
		width,
		height
	};
}

function showSnapPreview(rect) {
	if (!snapPreview) {
		snapPreview = el('div', { class: 'snap-preview', hidden: true });
		document.body.appendChild(snapPreview);
	}
	snapPreview.hidden = !rect;
	if (!rect) return;
	Object.assign(snapPreview.style, {
		left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`
	});
}

// blocks dropped into the column at side, stacked from the slot's top in
// their order: the first where the slot says, each next under the one before
function snapPanes(blocks, side, slot) {
	const col = snapColumns[side];
	if (!col.panes.length) col.width = slot.width / viewportWidth();
	let y = slot.top;
	blocks.forEach(block => {
		dlog(`snapPane: ${block.dataset.mapId} → ${side}`);
		unsnapPane(block);
		attachSnapPane(col, block, y / viewportHeight());
		layoutSnapColumns();
		y = block.getBoundingClientRect().bottom;
	});
	persistSnapLayout();
}

// a popped-out block becomes a pane of the column with its top there (a free
// one bringing its height along, the one it has unless stored); the first
// one brings the column's ground and handle with it
function attachSnapPane(col, block, top, height) {
	if (!col.node) {
		col.node = el('div', { class: `snap-col snap-${col.side}` });
		col.ui = el('div', { class: `snap-ui snap-${col.side}` }, [
			el('div', { class: 'snap-edge', 'data-side': col.side })
		]);
		document.body.append(col.node, col.ui);
	}
	const pane = { block, top };
	if (block.classList.contains('free')) pane.height = height || block.offsetHeight / viewportHeight();
	col.panes.push(pane);
	block.classList.add('snapped', `snapped-${col.side}`); // the side places the pane's fullscreen (CSS)
}

// the pane floats again as it stood in the column, size and place kept
function unsnapPane(block) {
	const col = snapColumnOf(block);
	if (!col) return;
	dlog(`unsnapPane: ${block.dataset.mapId}`);
	col.panes = col.panes.filter(p => p.block !== block);
	block.classList.remove('snapped', `snapped-${col.side}`);
	if (!col.panes.length) dropSnapColumn(col);
	layoutSnapColumns();
	// not persisted here: the callers (a drag, a dock, a move between columns) end in a state of their own
}

function dropSnapColumn(col) {
	if (col.node) col.node.remove();
	if (col.ui) col.ui.remove();
	col.node = col.ui = col.width = null;
	col.panes = [];
}

// the panes are gone with the tbody they were part of
function resetSnapColumns() {
	Object.values(snapColumns).forEach(dropSnapColumn);
	snapPageWidths = null;
	layoutSnapColumns();
}

function layoutSnapColumns() {
	// first: with the page hidden its scrollbar goes, which widens the viewport the columns are laid out in
	document.body.classList.toggle('snap-full', isSnapPageHidden());
	const root = document.documentElement.style;
	root.setProperty('--snap-l', `${snapColumnPx(snapColumns.left)}px`);
	root.setProperty('--snap-r', `${snapColumnPx(snapColumns.right)}px`);
	const seam = isSnapPageHidden() && snapColumns.left.panes.length && snapColumns.right.panes.length;
	Object.values(snapColumns).forEach(col => layoutSnapColumn(col, seam));
}

// with two columns meeting, the left edge handle is the seam between them and
// the right one steps aside
function layoutSnapColumn(col, seam) {
	const width = snapColumnPx(col);
	if (!width) return;
	const x = col.side === 'left' ? 0 : viewportWidth() - width;
	[col.node, col.ui].forEach(node => {
		node.style.left = `${x}px`;
		node.style.width = `${width}px`;
	});
	const edge = col.ui.querySelector('.snap-edge');
	edge.hidden = seam && col.side === 'right';
	edge.classList.toggle('snap-seam', seam && col.side === 'left');
	edge.title = seam ? 'Širina stupaca · dvoklik vraća stranicu'
		: isSnapPageHidden() ? 'Širina stupca · dvoklik vraća stranicu'
		: 'Širina stupca · dvoklik sakriva stranicu';
	col.panes.forEach(pane => fitSnapPane(pane, x, width));
}

// a pane takes the column's width: a free one with the height it carries, a
// locked one with the height its aspect gives at that width, pulled in to
// what its content spans (an image stops at its natural width and a map with
// a maxWidth at that, and the title bar and indicators must not run on past
// them across a wider column) and centred in the column. Its top is the one
// it carries, held inside the viewport
function fitSnapPane(pane, x, width) {
	const block = pane.block;
	block.style.width = `${width}px`;
	if (pane.height !== undefined) {
		block.style.height = `${Math.round(clamp(pane.height * viewportHeight(), POPOUT_MIN_HEIGHT, viewportHeight()))}px`;
	} else {
		const content = snapContentWidth(block);
		if (content && content < block.offsetWidth - 1) block.style.width = `${Math.ceil(content)}px`;
	}
	block.style.left = `${Math.round(x + (width - block.offsetWidth) / 2)}px`;
	block.style.top = `${Math.round(clamp(pane.top * viewportHeight(), 0, Math.max(0, viewportHeight() - block.offsetHeight)))}px`;
}

// the narrowest of what is on screen and constrained on its own: a title bar
// carries the map's maxWidth, an image or video its natural width (an image
// still loading measures 0 and does not count — the load listener below fits
// again once it has)
function snapContentWidth(block) {
	const widths = [...block.querySelectorAll('.radartitle, img, video')]
		.map(node => node.getBoundingClientRect().width)
		.filter(w => w > 0);
	return widths.length ? Math.min(...widths) : 0;
}

// panes moved up or down their column by one offset from where they stood
// (starts, their box): the box is drawn to the column's magnets and held
// inside the viewport, and the tops the panes carry follow
function movePanes(col, starts, box, dy) {
	const top = paneTop(col, box.top + dy, box.height, starts.map(s => s.block));
	dy = top - box.top;
	starts.forEach(s => { snapPaneOf(s.block).top = (s.top + dy) / viewportHeight(); });
	layoutSnapColumns();
}

// the inner edge: the column may take everything the other one leaves, and
// close to that it snaps shut, hiding the page (the widths from before are
// kept for the double-click back)
function resizeSnapColumn(col, e) {
	const start = snapColumnPx(col);
	const max = viewportWidth() - snapColumnPx(otherSnapColumn(col));
	const before = { left: snapColumnWidth(snapColumns.left), right: snapColumnWidth(snapColumns.right) };
	trackPopoutPointer(e, (dx) => {
		let px = clamp(col.side === 'left' ? start + dx : start - dx, SNAP_MIN_WIDTH, max);
		if (px >= max - SNAP_SHUT) px = max;
		const width = px / viewportWidth();
		// exactly what the other leaves: the fractions have to sum to one for the hidden state to read
		col.width = px === max ? 1 - snapColumnWidth(otherSnapColumn(col)) : width;
		if (isSnapPageHidden() && !snapPageWidths && before.left + before.right < 0.999) snapPageWidths = before;
		if (!isSnapPageHidden()) snapPageWidths = null;
		layoutSnapColumns();
	}, persistSnapLayout);
}

// the seam between two columns that meet moves width from one to the other
function resizeSnapSeam(e) {
	const { left, right } = snapColumns;
	const start = snapColumnPx(left);
	trackPopoutPointer(e, (dx) => {
		const px = clamp(start + dx, SNAP_MIN_WIDTH, viewportWidth() - SNAP_MIN_WIDTH);
		left.width = px / viewportWidth();
		right.width = 1 - left.width;
		layoutSnapColumns();
	}, persistSnapLayout);
}

// double-click on an edge: hide the page behind the columns — this column
// takes what the other leaves — or bring it back, to the widths from before
// the page was hidden, else with a gap wide enough for the page's table
function toggleSnapPage(col) {
	const other = otherSnapColumn(col);
	if (!isSnapPageHidden()) {
		snapPageWidths = { left: snapColumnWidth(snapColumns.left), right: snapColumnWidth(snapColumns.right) };
		col.width = 1 - snapColumnWidth(other);
	} else if (snapPageWidths && snapPageWidths.left + snapPageWidths.right < 0.999) {
		[snapColumns.left, snapColumns.right].forEach(c => { if (c.panes.length && snapPageWidths[c.side]) c.width = snapPageWidths[c.side]; });
		snapPageWidths = null;
	} else {
		const gap = Math.min(0.5, POPOUT_MAX_WIDTH / viewportWidth());
		[snapColumns.left, snapColumns.right].forEach(c => { if (c.panes.length) c.width *= 1 - gap; });
		snapPageWidths = null;
	}
	layoutSnapColumns();
	persistSnapLayout();
}

function snapHandlePointerDown(handle, e) {
	if (handle.classList.contains('snap-seam')) resizeSnapSeam(e);
	else resizeSnapColumn(snapColumns[handle.dataset.side], e);
}

// the drag's preventDefault on pointerdown leaves click and dblclick alone,
// and the browser already tells a double-click from two drags apart
document.addEventListener('dblclick', (e) => {
	const edge = e.target.closest && e.target.closest('.snap-edge');
	if (edge) toggleSnapPage(snapColumns[edge.dataset.side]);
});

// ---------- snap layout: remembered and shared ----------

// the arrangement as data: per side the column width and the panes as map
// ids with their tops (and a free pane's height), every number a fraction of
// the viewport, so another window or screen gets the proportions. Null when
// nothing is snapped. It rides in mapPrefs next to the map list, in a saved
// preset next to its maps, and in the ?v= payload — always a subset of the
// map list it sits beside, which is what sanitizeSnapLayout() holds it to on
// the way back. A group is a number shared by its members' entries, counted
// in order of appearance across the columns and the floating widgets
function snapLayout() {
	const layout = {};
	const groupNumbers = new Map();
	const groupNumber = (block) => {
		if (!block._group) return undefined;
		if (!groupNumbers.has(block._group)) groupNumbers.set(block._group, groupNumbers.size + 1);
		return groupNumbers.get(block._group);
	};
	Object.values(snapColumns).forEach(col => {
		if (!col.panes.length) return;
		layout[col.side] = {
			width: roundFraction(col.width),
			panes: [...col.panes].sort((a, b) => a.top - b.top).map(p => {
				const entry = { id: p.block.dataset.mapId, top: roundFraction(p.top) };
				if (p.height !== undefined) entry.height = roundFraction(p.height);
				const group = groupNumber(p.block);
				if (group) entry.group = group;
				return entry;
			})
		};
	});
	// widgets floating over the page, bottom to top, so they stack the same
	// way again; a locked one has no height of its own to store
	const floating = floatingBlocks()
		.sort((a, b) => (Number(a.style.zIndex) || 0) - (Number(b.style.zIndex) || 0))
		.map(block => {
			const rect = block.getBoundingClientRect();
			const entry = {
				id: block.dataset.mapId,
				left: roundFraction(rect.left / viewportWidth()),
				top: roundFraction(rect.top / viewportHeight()),
				width: roundFraction(rect.width / viewportWidth())
			};
			if (block.classList.contains('free')) entry.height = roundFraction(rect.height / viewportHeight());
			const group = groupNumber(block);
			if (group) entry.group = group;
			return entry;
		});
	if (floating.length) layout.floating = floating;
	return Object.keys(layout).length ? layout : null;
}

function roundFraction(n) {
	return Math.round(n * 10000) / 10000;
}

// rebuilt rather than trusted (storage, links, a saved entry): a pane must
// name a map in the list, once across both columns and the floating widgets,
// and carry a top (a layout from before panes were placed freely carries a
// height share instead: those are stacked from the top as they were); the
// two widths are held to the viewport. A map dropped from the list leaves
// the layout, and an emptied column with it. A group is its members' place
// as much as their number: fewer than two, or spread over two places, is no
// group
function sanitizeSnapLayout(layout, mapIds) {
	if (!layout || typeof layout !== 'object') return null;
	const clean = {};
	const seen = new Set();
	const fraction = (n, max = 1) => Number.isFinite(n) && n >= 0 && n <= max;
	const groupOf = (entry) => Number.isInteger(entry.group) && entry.group > 0 ? entry.group : undefined;
	['left', 'right'].forEach(side => {
		const col = layout[side];
		if (!col || typeof col !== 'object' || !Array.isArray(col.panes)) return;
		const width = Number(col.width);
		if (!(width > 0 && width <= 1)) return;
		const panes = [];
		let stacked = 0;
		col.panes.forEach(p => {
			if (!(p && typeof p.id === 'string' && mapIds.includes(p.id) && !seen.has(p.id))) return;
			const entry = { id: p.id };
			const top = Number(p.top), height = Number(p.height), share = Number(p.share);
			if (fraction(top)) {
				entry.top = roundFraction(top);
			} else if (share > 0 && share <= 1) {
				entry.top = roundFraction(stacked);
				entry.height = roundFraction(share);
				stacked += share;
			} else {
				return;
			}
			if (fraction(height) && height > 0) entry.height = roundFraction(height);
			const group = groupOf(p);
			if (group) entry.group = group;
			seen.add(p.id);
			panes.push(entry);
		});
		if (!panes.length) return;
		clean[side] = { width: roundFraction(width), panes };
	});
	if (clean.left && clean.right && clean.left.width + clean.right.width > 1) {
		clean.right.width = roundFraction(1 - clean.left.width);
		if (clean.right.width <= 0) delete clean.right;
	}
	if (Array.isArray(layout.floating)) {
		const floating = layout.floating
			.filter(f => f && typeof f.id === 'string' && mapIds.includes(f.id) && !seen.has(f.id)
				&& fraction(Number(f.left)) && fraction(Number(f.top)) && fraction(Number(f.width)) && Number(f.width) > 0)
			.map(f => {
				seen.add(f.id);
				const entry = { id: f.id, left: roundFraction(Number(f.left)), top: roundFraction(Number(f.top)), width: roundFraction(Number(f.width)) };
				if (fraction(Number(f.height)) && Number(f.height) > 0) entry.height = roundFraction(Number(f.height));
				const group = groupOf(f);
				if (group) entry.group = group;
				return entry;
			});
		if (floating.length) clean.floating = floating;
	}
	const lists = [clean.left && clean.left.panes, clean.right && clean.right.panes, clean.floating].filter(Boolean);
	const groups = new Map(); // group number → how many members, over how many places
	lists.forEach(list => list.forEach(entry => {
		if (!entry.group) return;
		if (!groups.has(entry.group)) groups.set(entry.group, { count: 0, places: new Set() });
		groups.get(entry.group).count++;
		groups.get(entry.group).places.add(list);
	}));
	lists.forEach(list => list.forEach(entry => {
		const group = groups.get(entry.group);
		if (group && (group.count < 2 || group.places.size > 1)) delete entry.group;
	}));
	return Object.keys(clean).length ? clean : null;
}

function sameSnapLayout(a, b) {
	return JSON.stringify(a || null) === JSON.stringify(b || null);
}

// the columns from a (sanitized) layout, after a render: each pane is popped
// out and attached to its column as stored, then the widths are set as
// stored. Desktop only, like the gestures — on a phone the layout is carried,
// not shown
function applySnapLayout(layout) {
	resetSnapColumns();
	if (!layout || !POPOUT_MQ.matches) return;
	snapPersistPaused = true; // what is being applied is already what is stored
	const groupIds = new Map(); // stored group number → a fresh id
	const setGroup = (block, group) => {
		if (!group) return;
		if (!groupIds.has(group)) groupIds.set(group, `g${++groupSeq}`);
		block._group = groupIds.get(group);
	};
	['left', 'right'].forEach(side => {
		const stored = layout[side];
		if (!stored) return;
		const col = snapColumns[side];
		stored.panes.forEach(({ id, top, height, group }) => {
			const block = document.querySelector(`.map-block[data-map-id="${CSS.escape(id)}"]`);
			if (!block || block.classList.contains('popout')) return;
			popoutMap(block);
			attachSnapPane(col, block, top, height);
			setGroup(block, group);
		});
		if (!col.panes.length) return;
		col.width = clamp(stored.width * viewportWidth(), SNAP_MIN_WIDTH, viewportWidth()) / viewportWidth();
	});
	const { left, right } = snapColumns;
	if (left.panes.length && right.panes.length && left.width + right.width > 1) right.width = 1 - left.width;
	layoutSnapColumns();
	(layout.floating || []).forEach(({ id, left, top, width, height, group }) => {
		const block = document.querySelector(`.map-block[data-map-id="${CSS.escape(id)}"]`);
		if (!block || block.classList.contains('popout')) return;
		popoutMap(block);
		block.style.width = `${Math.round(clamp(width * viewportWidth(), POPOUT_MIN_WIDTH, Math.min(POPOUT_MAX_WIDTH, viewportWidth() - POPOUT_MARGIN)))}px`;
		if (block.classList.contains('free') && height)
			block.style.height = `${Math.round(clamp(height * viewportHeight(), POPOUT_MIN_HEIGHT, viewportHeight() - POPOUT_MARGIN))}px`;
		placePopout(block, left * viewportWidth(), top * viewportHeight());
		raisePopout(block); // in stored order, so the last one is on top again
		setGroup(block, group);
	});
	updateGroups();
	snapPersistPaused = false;
}

function applyStoredSnapLayout() {
	applySnapLayout(sanitizeSnapLayout(getActiveMapPrefs().layout, resolveMapIds()));
}

let snapPersistPaused = false;

// the arrangement is written as it changes — it is direct manipulation, not
// a form with an apply button — next to the map list it belongs to: into the
// preferences, or, while a shared view is on, into that view and back into
// the address bar, so the link stays re-copyable with the arrangement as it
// is now and a refresh keeps it (the recipient's storage is still never
// written). Paused while the breakpoint docks everything: that is the window
// changing, not the arrangement
function persistSnapLayout() {
	// every gesture ends here: what touches what may have changed
	updateGroups();
	if (snapPersistPaused) return;
	const layout = snapLayout();
	if (sharedMapView) {
		if (layout) sharedMapView.layout = layout;
		else delete sharedMapView.layout;
		const url = new URL(window.location);
		url.searchParams.set('v', encodeMapView(sharedMapView));
		history.replaceState(null, '', url);
	} else {
		const prefs = getMapPrefs();
		if (layout) prefs.layout = layout;
		else delete prefs.layout;
		saveMapPrefs(prefs);
	}
	// the settings panel, if open, names the arrangement and offers Ažuriraj off it
	const panel = document.getElementById('mapSettings');
	if (panel && !panel.hidden && panel._onLayoutChange) panel._onLayoutChange();
}

// a fullscreen map fills its container (CSS off --snap-l/--snap-r and the
// pane's side class); main.js says when one is toggled, so the column can
// hide its dividers under it — and, when the page's scroll lock takes the
// scrollbar, the viewport the columns are laid out in has changed width
document.addEventListener('map-fullscreen', () => {
	// only the bar and the map move to the fullscreen place; the widget's box
	// would stay behind, an empty frame over whatever it was floating on.
	// The widgets floating over the page stay in view over the fullscreen map:
	// the host goes under every other widget for as long as it hosts one (the
	// page's own fullscreen sits there through the CSS), then back on top
	document.querySelectorAll('.map-block.popout').forEach(block => {
		const hosting = !!block.querySelector('.if1.fullscreen');
		const wasHosting = block.classList.contains('fs-host');
		block.classList.toggle('fs-host', hosting);
		if (hosting) block.style.zIndex = POPOUT_FS_Z;
		else if (wasHosting) raisePopout(block);
	});
	layoutSnapColumns();
});

// a locked pane's height can change under the fit: a titled slideshow takes
// its width from the image (so the real height is there once it has loaded)
// and changes aspect with the slide (arrows and swipe end in a click or a
// pointerup) — fit again after the change has been applied
['load', 'click', 'pointerup'].forEach(type => {
	document.addEventListener(type, (e) => {
		const block = e.target.closest && e.target.closest('.map-block.snapped:not(.free)');
		if (block) setTimeout(layoutSnapColumns, 0);
	}, true);
});

// ---------- settings panel ----------

function setMapSettingsVisible(panel, visible) {
	panel.hidden = !visible;
	const arrow = document.querySelector('.buttons button.btn .arrow');
	if (arrow) arrow.textContent = visible ? '▲' : '▼';
}

function toggleMapSettings() {
	const panel = document.getElementById('mapSettings');
	if (!panel) return;
	if (panel.hidden) {
		buildMapSettings(panel);
		setMapSettingsVisible(panel, true);
	} else {
		setMapSettingsVisible(panel, false);
	}
}

function buildMapSettings(panel) {
	panel.replaceChildren();

	// two sections: the selected block is the render order (draggable), the
	// available block below is only a finding surface and can be sorted freely
	const selectedDiv = el('div', { class: 'ms-list ms-selected' });
	const availableDiv = el('div', { class: 'ms-list ms-available' });

	let sortKey = 'zadano';
	let sortAsc = true;

	function compareRows(a, b) {
		const ma = MAP_CATALOG.find(m => m.id === a.getAttribute('data-map-id'));
		const mb = MAP_CATALOG.find(m => m.id === b.getAttribute('data-map-id'));
		const dir = sortAsc ? 1 : -1;
		if (sortKey === 'naziv') return ma.name.localeCompare(mb.name, 'hr') * dir;
		if (sortKey === 'vrsta') return (ma.category.localeCompare(mb.category, 'hr') || ma.name.localeCompare(mb.name, 'hr')) * dir;
		return (MAP_CATALOG.indexOf(ma) - MAP_CATALOG.indexOf(mb)) * dir;
	}

	function sortAvailable() {
		[...availableDiv.children].sort(compareRows).forEach(row => availableDiv.appendChild(row));
	}

	const sortLinks = {};
	const sortDiv = el('div', { class: 'ms-sort' }, [el('span', { text: 'Poredaj:' })]);
	[['zadano', 'Zadano'], ['naziv', 'Naziv'], ['vrsta', 'Vrsta']].forEach(([key, label]) => {
		const link = el('a', { text: label });
		link.addEventListener('click', () => {
			if (sortKey === key) sortAsc = !sortAsc;
			else { sortKey = key; sortAsc = true; }
			updateSortLinks();
			sortAvailable();
		});
		sortLinks[key] = { link, label };
		sortDiv.appendChild(link);
	});

	function updateSortLinks() {
		for (const [key, { link, label }] of Object.entries(sortLinks)) {
			const active = key === sortKey;
			link.classList.toggle('active', active);
			link.textContent = active ? `${label} ${sortAsc ? '▲' : '▼'}` : label;
		}
	}
	updateSortLinks();

	function markCustom() {
		panel.querySelector('input[name="msPreset"][value="custom"]').checked = true;
		// the edit may have just put the list out of step with the preset it came
		// from, or brought it back into step, which is what both marks hang off
		updateOriginMark();
		renderManage();
	}

	// pointer-events drag reorder: works for both mouse and touch (the HTML5
	// drag-and-drop API does not fire on mobile); touch-action: none on the
	// handle keeps the browser from scrolling instead
	function enableDragReorder(handle, row) {
		handle.addEventListener('pointerdown', (e) => {
			e.preventDefault(); // no text selection while dragging with a mouse
			// no pointer capture at all: touch pointers implicitly capture the
			// handle, and any capture (implicit or moved elsewhere) misbehaves
			// once the row moves in the DOM; releasing it lets the events
			// hit-test naturally and bubble to the document-level listeners
			if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
			row.classList.add('dragging');
			const startNext = row.nextElementSibling;
			let lastY = e.clientY;
			let scrollDir = 0;
			let raf = null;

			// move the row before the first sibling whose midpoint is below the pointer
			const reorder = () => {
				const target = [...selectedDiv.children].find(sibling =>
					sibling !== row && lastY < sibling.getBoundingClientRect().top + sibling.offsetHeight / 2);
				if (target) {
					if (target.previousElementSibling !== row) selectedDiv.insertBefore(row, target);
				} else if (selectedDiv.lastElementChild !== row) {
					selectedDiv.appendChild(row);
				}
			};

			// keep scrolling (and reordering) while the pointer rests near a viewport edge
			const autoScroll = () => {
				if (scrollDir !== 0) {
					window.scrollBy(0, scrollDir);
					reorder();
				}
				raf = requestAnimationFrame(autoScroll);
			};

			const onMove = (ev) => {
				if (ev.buttons === 0) { onEnd(); return; } // pointerup was missed (released outside the window)
				lastY = ev.clientY;
				const margin = 60;
				scrollDir = lastY < margin ? -8 : (lastY > window.innerHeight - margin ? 8 : 0);
				reorder();
			};

			const onEnd = () => {
				document.removeEventListener('pointermove', onMove);
				document.removeEventListener('pointerup', onEnd);
				document.removeEventListener('pointercancel', onEnd);
				cancelAnimationFrame(raf);
				row.classList.remove('dragging');
				if (row.nextElementSibling !== startNext) markCustom();
			};

			document.addEventListener('pointermove', onMove);
			document.addEventListener('pointerup', onEnd);
			document.addEventListener('pointercancel', onEnd);
			raf = requestAnimationFrame(autoScroll);
		});
	}

	function buildRow(map, checked) {
		const checkbox = el('input', { type: 'checkbox' });
		checkbox.checked = checked;
		const handle = el('span', { class: 'ms-handle', text: '≡', title: 'Povuci za premještanje' });
		const row = el('div', { class: 'ms-item', 'data-map-id': map.id }, [
			el('label', {}, [
				checkbox,
				el('span', { class: 'ms-glyph', text: CATEGORY_GLYPHS[map.category] || '' }),
				document.createTextNode(map.name)
			]),
			handle
		]);
		checkbox.addEventListener('change', () => {
			// checking appends to the page order; unchecking returns the row to the sorted shelf
			if (checkbox.checked) {
				selectedDiv.appendChild(row);
			} else {
				availableDiv.appendChild(row);
				sortAvailable();
			}
			markCustom();
		});
		enableDragReorder(handle, row);
		return row;
	}

	function fillList(selectedIds) {
		selectedDiv.replaceChildren();
		availableDiv.replaceChildren();
		selectedIds.forEach(id => {
			const map = MAP_CATALOG.find(m => m.id === id);
			if (map) selectedDiv.appendChild(buildRow(map, true));
		});
		MAP_CATALOG.filter(map => !selectedIds.includes(map.id))
			.forEach(map => availableDiv.appendChild(buildRow(map, false)));
		sortAvailable();
	}

	const presetsDiv = el('div', { class: 'ms-presets' });

	// which preset the list in the picker came from, built-in or saved. Editing
	// it flips the bar to "Prilagođeno" (see markCustom), so the selection can no
	// longer say where the list started: this is what the dot on the origin chip
	// and the "Ažuriraj" link on the saved row both hang off. Null whenever the
	// list is nobody's — a stored custom view, or a shared one matching nothing.
	let editingPresetId = activePresetId() === 'custom' ? null : activePresetId();

	// rebuilt whenever the saved presets change, so they sit among the
	// built-ins and stay selectable the same way
	function renderPresets(selectedId) {
		presetsDiv.replaceChildren();
		const options = [...visiblePresets(), { id: 'custom', name: 'Prilagođeno' }];
		// a hidden preset has no radio to check, and the maps on screen are still
		// its own, so the selection becomes custom rather than silently reverting
		if (!options.some(preset => preset.id === selectedId)) selectedId = 'custom';
		options.forEach(preset => {
			const radio = el('input', { type: 'radio', name: 'msPreset', value: preset.id });
			radio.checked = preset.id === selectedId;
			radio.addEventListener('change', () => {
				// switching to a named preset previews its list; "custom" keeps the current list
				if (preset.id !== 'custom') fillList(presetMapIds(preset.id));
				// picking "Prilagođeno" by hand detaches the list from wherever it
				// came from: no dot, and no row offering to take the edits back
				editingPresetId = preset.id === 'custom' ? null : preset.id;
				updateOriginMark();
				renderManage();
			});
			// a corner mark on the saved ones, so the two kinds stay apart in the
			// bar the way the management list below already keeps them apart
			const chipClass = 'ms-chip' + (isUserPresetId(preset.id) ? ' ms-user' : '');
			// the name rides in a span rather than a bare text node so the chip
			// styling can hang off the radio's :checked as a sibling selector
			presetsDiv.appendChild(el('label', {}, [radio, el('span', { class: chipClass, text: preset.name })]));
		});
		// carries no content: it exists so the last line has something to give
		// its leftover width to, leaving those chips at their natural size
		// while the full lines above still stretch to both edges
		presetsDiv.appendChild(el('span', { class: 'ms-fill' }));
		updateOriginMark(); // the chips are new, so the dot has to be put back
	}

	// The dot marks the preset the list on screen started from, once it no longer
	// matches it. "Prilagođeno" keeps the selection — what travels in a share link
	// is a bare list, and a chip left looking selected would promise a name the
	// payload cannot carry — so the dot says which named view the edits are a copy
	// of without claiming to be it. Clicking that chip reloads the preset and
	// drops the edits, which the radio already does: it is the unchecked one.
	function updateOriginMark() {
		presetsDiv.querySelectorAll('.ms-origin').forEach(chip => chip.classList.remove('ms-origin'));
		const preset = allPresets().find(p => p.id === editingPresetId);
		// a hidden preset has no chip to mark, hence the guard on the radio
		if (!preset || sameMapIds(preset.maps, selectedMapIds())) return;
		// compared rather than built into a selector: ids come from localStorage,
		// where a hand-edited one could carry a quote and throw on querySelector
		const radio = [...presetsDiv.querySelectorAll('input')].find(input => input.value === editingPresetId);
		if (radio) radio.nextElementSibling.classList.add('ms-origin');
	}

	// the list first: renderPresets reads it back to decide where the dot goes,
	// and an empty picker would read as "edited away from the origin"
	fillList(resolveMapIds());

	renderPresets(activePresetId());

	function checkedPresetId() {
		const checked = panel.querySelector('input[name="msPreset"]:checked');
		return checked ? checked.value : 'zadano';
	}

	// the selected block holds exactly the checked rows, in render order
	function selectedMapIds() {
		return [...selectedDiv.children].map(row => row.getAttribute('data-map-id'));
	}

	function readPanelPrefs() {
		const presetId = checkedPresetId();
		if (presetId === 'custom') return { preset: 'custom', maps: selectedMapIds() };
		return { preset: presetId };
	}

	// the arrangement to go with a prefs object. A preset is a whole view:
	// applying a saved one brings its own arrangement (none, if it was saved
	// with nothing popped out), and a built-in has none, so everything docks.
	// Only the custom list keeps what is on screen, as far as its maps allow —
	// that is an edit of the current view, not a switch to another one
	function layoutForPrefs(prefs) {
		if (prefs.preset === 'custom') return sanitizeSnapLayout(snapLayout(), prefsMapIds(prefs));
		const preset = userPresets.find(p => p.id === prefs.preset);
		return preset ? sanitizeSnapLayout(preset.layout, prefsMapIds(prefs)) : null;
	}

	// the arrangement on screen, held to the list in the picker (a map unchecked
	// there cannot stay a pane)
	function selectedLayout() {
		return sanitizeSnapLayout(snapLayout(), selectedMapIds());
	}

	// the panel's own share button carries whatever is on screen, expanding a
	// saved preset the same way the per-preset links do
	function readSharePrefs() {
		const prefs = readPanelPrefs();
		const preset = userPresets.find(p => p.id === prefs.preset);
		if (preset) return presetSharePrefs(preset);
		const layout = layoutForPrefs(prefs);
		if (layout) prefs.layout = layout;
		return prefs;
	}

	// what is snapped, and a way to put it all back; shown only while there is
	// something to say. The line is the panel's only sign that the arrangement
	// is part of the view a preset saves and a link carries
	const layoutDiv = el('div', { class: 'ms-layout' });

	function renderLayoutLine() {
		layoutDiv.replaceChildren();
		const layout = snapLayout();
		layoutDiv.hidden = !layout;
		if (!layout) return;
		const parts = [];
		if (layout.left) parts.push(`lijevo ${layout.left.panes.length}`);
		if (layout.right) parts.push(`desno ${layout.right.panes.length}`);
		if (layout.floating) parts.push(`u prozoru ${layout.floating.length}`);
		const backLink = el('a', { text: 'Vrati sve' });
		backLink.addEventListener('click', dockAllPopouts); // the change comes back through _onLayoutChange
		layoutDiv.append(el('span', { text: `Izdvojene karte: ${parts.join(', ')}` }), backLink);
	}
	renderLayoutLine();

	// the arrangement changes behind the open panel — a map popped out, a pane
	// snapped, everything put back — and the line and Ažuriraj follow at once
	panel._onLayoutChange = () => {
		renderLayoutLine();
		renderManage();
	};

	// ----- saved preset management -----

	const manageDiv = el('div', { class: 'ms-manage' });

	// whether the name field is open; the field itself outlives every re-render
	// so what was typed survives a row being deleted or hidden underneath it
	let addingPreset = false;

	const nameInput = el('input', {
		type: 'text', class: 'ms-name', maxlength: String(PRESET_NAME_MAX),
		placeholder: 'Naziv predloška'
	});
	const saveBtn = el('button', { type: 'button', class: 'btn', text: 'Spremi' });

	function saveCurrentAs(name) {
		const preset = storeUserPreset(name, selectedMapIds(), selectedLayout());
		nameInput.value = '';
		addingPreset = false; // the form has done its job
		editingPresetId = preset.id; // the list is now this preset's, so edits from here go back to it
		renderPresets(preset.id); // saving selects what was just saved
		renderManage();
	}

	saveBtn.addEventListener('click', () => {
		const name = cleanPresetName(nameInput.value);
		if (!name) { nameInput.focus(); return; }
		saveCurrentAs(name);
	});
	nameInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') { e.preventDefault(); saveBtn.click(); }
		else if (e.key === 'Escape') { // same way out as the rename editor
			addingPreset = false;
			nameInput.value = '';
			renderManage();
		}
	});

	// which preset is being renamed, if any; renderManage builds that one row as
	// an editor, so starting a second rename closes the first on its own
	let renamingId = null;

	// mirrors nameInput: the editor outlives renderManage, so what was typed
	// survives a re-render started from anywhere else in the panel — hiding a
	// built-in, opening the add form, deleting another row. A rebuilt input
	// would reset itself to the stored name and drop the edit in progress.
	const renameInput = el('input', {
		type: 'text', class: 'ms-name ms-rename', maxlength: String(PRESET_NAME_MAX)
	});

	// set only where the editor is opened, so those same re-renders leave the
	// focus wherever the user just put it
	let renameOpening = false;

	function startRename(preset) {
		renamingId = preset.id;
		renameInput.value = preset.name;
		renameInput.classList.remove('invalid');
		renameOpening = true;
		renderManage();
	}

	function commitRename() {
		const preset = userPresets.find(p => p.id === renamingId);
		if (!preset) return;
		const name = cleanPresetName(renameInput.value);
		const clash = findUserPresetByName(name);
		// empty, or a name another preset already holds: stay in the editor and
		// mark the field rather than silently dropping what was typed
		if (!name || (clash && clash !== preset)) {
			renameInput.classList.add('invalid');
			renameInput.focus();
			return;
		}
		preset.name = name;
		saveUserPresets();
		renamingId = null;
		renderPresets(checkedPresetId());
		renderManage();
	}

	function cancelRename() {
		renamingId = null;
		renderManage();
	}

	// bound once, on the element that outlives the re-renders
	renameInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
		else if (e.key === 'Escape') cancelRename();
	});
	renameInput.addEventListener('input', () => renameInput.classList.remove('invalid'));

	// the action slots line up as columns down the list, so a row without one
	// leaves it empty instead of shifting the rest along. Three is what fits a
	// phone row beside the name, so an action added here has to replace one
	// rather than join them — see the Ažuriraj/Podijeli swap below.
	function buildLinkCells(cells) {
		return el('span', { class: 'ms-manage-links' }, cells.map(cell => cell || el('span')));
	}

	// only the preset the list came from: any other row would take an overwrite
	// with a list that has nothing to do with it. Saving under the same name in
	// the add form still works and is unchanged — this is the same write, minus
	// having to know that the name is the handle. The saved-preset guard is not
	// redundant: editingPresetId also holds built-in ids (they carry the origin
	// dot), and a built-in reaching storeUserPreset would fork a saved copy of
	// itself under its own name rather than update anything.
	// The arrangement counts as an edit too — it is part of what the preset
	// stores — but only here: the origin dot on the chip marks a changed list,
	// which is what the panel itself edits, and a rearranged page still shows
	// the preset's maps.
	function hasPendingEdits(preset) {
		return isUserPresetId(preset.id) && preset.id === editingPresetId
			&& (!sameMapIds(preset.maps, selectedMapIds()) || !sameSnapLayout(preset.layout, selectedLayout()));
	}

	// shares the preset as saved — the panel's Podijeli button is the one that
	// carries unsaved edits to the list. Built-ins share by id, which every
	// visitor resolves; a saved preset has to carry its contents instead.
	function buildShareLink(getPrefs) {
		const link = el('a', { text: 'Podijeli' });
		link.addEventListener('click', () => {
			copyMapViewLink(getPrefs(), () => flashLabel(link, 'Kopirano!', 'Podijeli'));
		});
		return link;
	}

	function buildBuiltinRow(preset) {
		const hidden = isPresetHidden(preset.id);

		// the permanent one keeps its row but not the toggle, so it reads as an
		// option that was never on offer rather than one that failed to work
		let toggleLink = null;
		if (isHideablePreset(preset.id)) {
			toggleLink = el('a', { text: hidden ? 'Prikaži' : 'Sakrij' });
			toggleLink.addEventListener('click', () => {
				setPresetHidden(preset.id, !hidden);
				// renderPresets drops a selection that just became invisible
				renderPresets(checkedPresetId());
				renderManage();
			});
		}
		// no share link: a built-in resolves for every visitor already, so a link
		// to one carries nothing they lack — and the panel's Podijeli button
		// covers sharing whichever view is on screen. The toggle takes the last
		// slot so it ends the row where Obriši ends the ones above.
		return el('div', { class: 'ms-manage-item' + (hidden ? ' ms-hidden' : '') }, [
			el('span', { class: 'ms-manage-name', text: preset.name }),
			buildLinkCells([null, null, toggleLink])
		]);
	}

	function buildManageRow(preset) {
		if (preset.id === renamingId) return buildRenameRow();

		const renameLink = el('a', { text: 'Preimenuj' });
		const deleteLink = el('a', { text: 'Obriši' });

		// writes the list on screen over this preset, keeping its id — so saved
		// preferences and links naming it follow the change instead of breaking.
		// It saves the preset only: the page still shows the old view until
		// Primijeni, the same as every other panel action.
		//
		// It takes the share slot rather than a fourth one: four columns overflow
		// a phone row beside the name and drop every row's actions onto a second
		// line. Podijeli is the one to give up while a row has unsaved edits — it
		// shares the preset *as saved*, which is least useful exactly then, and
		// the panel's own Podijeli covers the list on screen. It comes back the
		// moment the edits are saved or dropped.
		let firstLink;
		if (hasPendingEdits(preset)) {
			firstLink = el('a', { text: 'Ažuriraj' });
			firstLink.addEventListener('click', () => {
				storeUserPreset(preset.name, selectedMapIds(), selectedLayout()); // by name, the one write path
				renderPresets(preset.id); // the list is this preset again, so its chip comes back
				renderManage();
			});
		} else {
			firstLink = buildShareLink(() => presetSharePrefs(preset));
		}

		const row = el('div', { class: 'ms-manage-item' }, [
			el('span', { class: 'ms-manage-name', text: preset.name }),
			buildLinkCells([firstLink, renameLink, deleteLink])
		]);

		renameLink.addEventListener('click', () => startRename(preset));

		// two-step instead of a confirm() dialog: the first click arms the link,
		// a second within a few seconds deletes, and it disarms itself otherwise
		let armed = null;
		const disarm = () => {
			clearTimeout(armed);
			armed = null;
			deleteLink.textContent = 'Obriši';
			deleteLink.classList.remove('active');
		};
		deleteLink.addEventListener('click', () => {
			if (!armed) {
				deleteLink.textContent = 'Sigurno?';
				deleteLink.classList.add('active');
				armed = setTimeout(disarm, 3000);
				return;
			}
			disarm();
			// the map list on screen is untouched — it just stops being a saved preset
			const wasSelected = checkedPresetId() === preset.id;
			if (editingPresetId === preset.id) editingPresetId = null; // nothing left to write back to
			deleteUserPreset(preset.id);
			renderPresets(wasSelected ? 'custom' : checkedPresetId());
			renderManage();
		});

		return row;
	}

	// the name is only committed on "Potvrdi" or Enter — never on leaving the
	// field, so clicking elsewhere can't rename anything behind your back
	function buildRenameRow() {
		const confirmLink = el('a', { text: 'Potvrdi' });
		const cancelLink = el('a', { text: 'Odustani' });
		confirmLink.addEventListener('click', commitRename);
		cancelLink.addEventListener('click', cancelRename);

		// Potvrdi and Odustani sit under Preimenuj and Obriši, the actions they stand in for
		return el('div', { class: 'ms-manage-item' }, [
			renameInput,
			buildLinkCells([null, confirmLink, cancelLink])
		]);
	}

	// the shared list is already one of the saved presets, so the bar has its
	// chip selected and "Spremi" would only add a second copy under a suffixed
	// name. Recomputed per render: deleting that preset brings the row back.
	function sharedAlreadySaved() {
		const ids = resolveMapIds();
		return userPresets.some(preset => sameMapIds(preset.maps, ids));
	}

	function buildSharedRow() {
		const saveLink = el('a', { text: 'Spremi' });
		saveLink.addEventListener('click', () => {
			// saves what is on screen, so any tweak the recipient made is kept
			saveCurrentAs(uniquePresetName(sharedMapView.name));
		});
		return el('div', { class: 'ms-shared' }, [
			el('span', { text: `Podijeljen predložak "${sharedMapView.name}"` }),
			saveLink
		]);
	}

	function buildBuiltinHeading() {
		const heading = el('div', { class: 'ms-manage-title', text: 'Zadani predlošci' });
		const links = el('span', { class: 'ms-manage-title-links' });

		const addLink = (text, apply) => {
			const link = el('a', { text: text });
			link.addEventListener('click', () => {
				apply();
				renderPresets(checkedPresetId());
				renderManage();
			});
			links.appendChild(link);
		};

		// each shown only while it would do something — "Sakrij sve" reaches
		// every preset but the permanent one, so that is the count to stop at
		if (hiddenPresets.length < hideablePresets().length) addLink('Sakrij sve', hideAllPresets);
		if (hiddenPresets.length) addLink('Prikaži sve', showAllPresets);

		heading.appendChild(links);
		return heading;
	}

	// the name field is only worth its space while a preset is being added, so
	// it lives behind "Dodaj" and folds away again once one is saved
	function buildUserHeading() {
		const heading = el('div', { class: 'ms-manage-title', text: 'Moji predlošci' });
		const addLink = el('a', { text: addingPreset ? 'Odustani' : 'Dodaj' });
		addLink.addEventListener('click', () => {
			addingPreset = !addingPreset;
			if (!addingPreset) nameInput.value = '';
			renderManage();
			// nameInput outlives the re-render, so this reaches the live field
			if (addingPreset) nameInput.focus();
		});
		heading.appendChild(el('span', { class: 'ms-manage-title-links' }, [addLink]));
		return heading;
	}

	function renderManage() {
		manageDiv.replaceChildren();

		// the built-ins are listed too, so a hidden one can be brought back
		// individually and not only through "Prikaži sve". They lead here the way
		// they lead the preset bar, where the saved ones follow them as well
		manageDiv.appendChild(buildBuiltinHeading());
		MAP_PRESETS.forEach(preset => manageDiv.appendChild(buildBuiltinRow(preset)));

		manageDiv.appendChild(buildUserHeading());
		if (addingPreset) manageDiv.appendChild(el('div', { class: 'ms-save' }, [nameInput, saveBtn]));
		if (sharedMapView && sharedMapView.name && !sharedAlreadySaved()) manageDiv.appendChild(buildSharedRow());
		if (userPresets.length) {
			userPresets.forEach(preset => manageDiv.appendChild(buildManageRow(preset)));
		} else {
			manageDiv.appendChild(el('div', { class: 'ms-manage-empty', text: 'Nema spremljenih predložaka' }));
		}

		// only where the rename was just opened — every other re-render leaves
		// the focus alone, including the ones that happen with an editor open
		if (renameOpening) {
			renameOpening = false;
			renameInput.focus();
			renameInput.select();
		}
	}

	renderManage();

	const applyBtn = el('button', { type: 'button', class: 'btn', text: 'Primijeni' });
	applyBtn.addEventListener('click', () => {
		const prefs = readPanelPrefs();
		const layout = layoutForPrefs(prefs);
		if (layout) prefs.layout = layout;
		saveMapPrefs(prefs);
		clearSharedMapView(); // the saved preferences take over from the shared link
		setMapSettingsVisible(panel, false);
		renderMaps();
		initDynamicContent();
		applySnapLayout(layout); // the render dropped the panes; these are the ones to come back
		scrollToTop(); // the panel collapse leaves the scroll offset mid-page
	});

	// a link, like the per-preset Podijeli it does the same job as; the filled
	// button is kept for Primijeni, the one action that changes the page
	const shareLink = el('a', { text: 'Podijeli' });
	shareLink.addEventListener('click', () => {
		copyMapViewLink(readSharePrefs(), () => flashLabel(shareLink, 'Kopirano!', 'Podijeli'));
	});

	// the actions sit right under the render order they act on, rather than at
	// the far end of the picker and the preset management below it
	panel.appendChild(presetsDiv);
	panel.appendChild(layoutDiv);
	panel.appendChild(selectedDiv);
	panel.appendChild(el('div', { class: 'ms-actions' }, [applyBtn, shareLink]));
	panel.appendChild(sortDiv);
	panel.appendChild(availableDiv);
	panel.appendChild(manageDiv);
}

// in dev this is a deferred external script, so the DOM is already parsed and
// the render happens immediately; the docs build inlines it into <head>
// (inline scripts cannot defer), where it must wait for DOMContentLoaded —
// registered before main.js's listener, so the wiring still sees the maps
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', renderMaps);
} else {
	renderMaps();
}
// the remembered arrangement, once the maps are there — registered after the
// render above, and DOMContentLoaded is also when main.js (dlog) has run in dev
document.addEventListener('DOMContentLoaded', applyStoredSnapLayout);
