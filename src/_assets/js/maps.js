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
			'https://maps.neverin.hr/radar/latest_hr.webp',
			'https://maps.neverin.hr/radar/anim_hr.webp',
			'https://maps.neverin.hr/radar/anim_hr_6h.webp'
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
			'https://maps.neverin.hr/radar/latest_eu2.webp',
			'https://maps.neverin.hr/radar/anim_eu2.webp',
			'https://maps.neverin.hr/radar/anim_eu2_6h.webp'
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
	'eumetnet', 'meteociel-satelit', 'chmi-sinopticka', 'neverin-kamera', 'meteoblue-prognoza'
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
			'dhmz-sinopticka', 'dhmz-puntijarka', 'dhmz-bilogora', 'dhmz-gradiste', 'dhmz-goli',
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

function isValidPreset(preset) {
	return preset && typeof preset.id === 'string' && preset.id.startsWith(USER_PRESET_PREFIX)
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
// view is to edit the list and save it again under the same name
function storeUserPreset(name, maps) {
	const existing = findUserPresetByName(name);
	if (existing) {
		existing.name = name;
		existing.maps = maps;
	} else {
		userPresets.push({ id: newPresetId(), name: name, maps: maps });
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
		saveMapPrefs({ preset: 'custom', maps: preset.maps.slice() });
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
	const prefs = getActiveMapPrefs();
	// deduped as well as filtered: a hand-crafted ?v= can name the same map
	// twice, and two rendered copies would share one data-slideshow-id — the
	// arrows drive whichever comes first while both sets of indicators light up
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
	return { preset: 'custom', maps: preset.maps.slice(), name: preset.name };
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
// unconstrained, their max-width sits on the .placeholder wrapper below
function buildTitleBar(title, map = {}) {
	return el('div', { class: 'radartitle', style: maxWidthStyle(map) || undefined }, [
		el('a', { href: title.href, target: '_blank', rel: 'nofollow', text: title.text })
	]);
}

// top-level title bars show the map's picker name; only slide titles
// carry their own text (it differs per slide)
function buildMapTitleBar(map) {
	return buildTitleBar({ text: map.name, href: map.titleHref }, map);
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
			// a slide may omit its title text to inherit the map name (its href still differs per slide)
			const title = { text: slide.title.text || map.name, href: slide.title.href };
			slideDiv.appendChild(buildTitleBar(title));
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
		const td = el('td', { align: 'center' });
		buildMapContent(map).forEach(node => {
			if (node) td.appendChild(node);
		});
		tbody.appendChild(el('tr', {}, [td]));
		if (map.links && map.links.length) {
			tbody.appendChild(el('tr', {}, [el('td', { align: 'center' }, [buildLinksBottom(map)])]));
		}
	});
}

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
	const prefs = getActiveMapPrefs();
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
			});
			// the name rides in a span rather than a bare text node so the chip
			// styling can hang off the radio's :checked as a sibling selector
			presetsDiv.appendChild(el('label', {}, [radio, el('span', { class: 'ms-chip', text: preset.name })]));
		});
		// carries no content: it exists so the last line has something to give
		// its leftover width to, leaving those chips at their natural size
		// while the full lines above still stretch to both edges
		presetsDiv.appendChild(el('span', { class: 'ms-fill' }));
	}

	renderPresets(prefs.preset);

	fillList(resolveMapIds());

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

	// the panel's own share button carries whatever is on screen, expanding a
	// saved preset the same way the per-preset links do
	function readSharePrefs() {
		const prefs = readPanelPrefs();
		const preset = userPresets.find(p => p.id === prefs.preset);
		return preset ? presetSharePrefs(preset) : prefs;
	}

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
		const preset = storeUserPreset(name, selectedMapIds());
		nameInput.value = '';
		addingPreset = false; // the form has done its job
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
	// leaves it empty instead of shifting the rest along
	function buildLinkCells(cells) {
		return el('span', { class: 'ms-manage-links' }, cells.map(cell => cell || el('span')));
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
		const row = el('div', { class: 'ms-manage-item' }, [
			el('span', { class: 'ms-manage-name', text: preset.name }),
			buildLinkCells([buildShareLink(() => presetSharePrefs(preset)), renameLink, deleteLink])
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
		manageDiv.appendChild(buildUserHeading());
		if (addingPreset) manageDiv.appendChild(el('div', { class: 'ms-save' }, [nameInput, saveBtn]));
		if (sharedMapView && sharedMapView.name) manageDiv.appendChild(buildSharedRow());
		if (userPresets.length) {
			userPresets.forEach(preset => manageDiv.appendChild(buildManageRow(preset)));
		} else {
			manageDiv.appendChild(el('div', { class: 'ms-manage-empty', text: 'Nema spremljenih predložaka' }));
		}

		// the built-ins are listed too, so a hidden one can be brought back
		// individually and not only through "Prikaži sve"
		manageDiv.appendChild(buildBuiltinHeading());
		MAP_PRESETS.forEach(preset => manageDiv.appendChild(buildBuiltinRow(preset)));

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
		saveMapPrefs(readPanelPrefs());
		clearSharedMapView(); // the saved preferences take over from the shared link
		setMapSettingsVisible(panel, false);
		renderMaps();
		initDynamicContent();
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
