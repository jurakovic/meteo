// Map catalog, renderer and user preferences (presets + custom pick/order).
// Loaded before main.js; renders maps into <tbody data-maps> at parse time
// so main.js's DOMContentLoaded wiring sees the finished DOM.

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

function except(links, ...names) {
	return links.filter(link => !names.includes(link.text));
}

// ---------- map catalog ----------

function dhmzMrcRadar(id, name) {
	return {
		id: `dhmz-${id}`,
		name: `DHMZ | MRC ${name}`,
		type: 'slideshow',
		title: { text: `DHMZ | MRC ${name}`, href: `https://meteo.hr/podaci.php?section=podaci_mjerenja&param=radari&el=${id}&acto=anim` },
		maxWidth: 720,
		aspect: '720 / 751',
		slides: [`https://vrijeme.hr/anim_${id}.gif`, `https://vrijeme.hr/${id}-stat.png`]
	};
}

const MAP_CATALOG = [
	{
		id: 'neverin-radar-hr',
		name: 'Neverin | Radar | Hrvatska',
		type: 'slideshow',
		title: { text: 'Neverin | Radar | Hrvatska', href: 'https://www.neverin.hr/radar/' },
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
		name: 'Neverin | Satelit | Hrvatska',
		type: 'slideshow',
		title: { text: 'Neverin | Satelit | Hrvatska', href: 'https://www.neverin.hr/satelit/' },
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
		name: 'Neverin | Radar | Europa',
		type: 'slideshow',
		title: { text: 'Neverin | Radar | Europa', href: 'https://www.neverin.hr/radar/' },
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
		name: 'Neverin | Satelit | Europa',
		type: 'slideshow',
		title: { text: 'Neverin | Satelit | Europa', href: 'https://www.neverin.hr/satelit/' },
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
		name: 'Windy | Radar',
		type: 'iframe',
		frameId: 'windy',
		title: { text: 'Windy', href: 'https://www.windy.com/-Radar-lightning-radar?radar,44.5,16.5,7' },
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
		name: 'DHMZ | Radar | Hrvatska',
		type: 'slideshow',
		title: { text: 'DHMZ | Radar | Hrvatska', href: 'https://meteo.hr/podaci.php?section=podaci_mjerenja&param=radari&el=kompozit&acto=anim' },
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
		name: 'Blitzortung.org | Munje',
		type: 'iframe',
		frameId: 'blitzortung',
		title: { text: 'Blitzortung.org | Munje', href: 'https://map.blitzortung.org/#6/44.5/16.5' },
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
		name: 'ESSL | Prognoza nevremena',
		type: 'slideshow',
		title: { text: 'ESSL | Prognoza nevremena', href: 'https://www.stormforecast.eu' },
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
		name: 'ASTORP | Prognoza nevremena',
		type: 'slideshow',
		title: { text: 'ASTORP | Prognoza nevremena', href: 'https://rawinsonde.com/ASTORP/ESTOFEX.html' },
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
		name: 'ESTOFEX | Prognoza nevremena',
		type: 'slideshow',
		title: { text: 'ESTOFEX | Prognoza nevremena', href: 'https://www.estofex.org' },
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
		name: 'EUMETNET | Radar | Europa',
		type: 'iframe-basic',
		title: { text: 'EUMETNET', href: 'https://www.eumetnet.eu/observations/opera-radar-animation/' },
		src: 'https://cdn.fmi.fi/demos/eumetnet-web-site-radar-animator/',
		links: RADAR_EU_LINKS
	},
	{
		id: 'meteociel-satelit',
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
		name: 'ČHMÚ | Sinoptička karta',
		type: 'slideshow',
		maxWidth: 760,
		dynamicWidth: true,
		slides: [
			{
				title: { text: 'ČHMÚ | Sinoptička karta', href: 'https://intranet.chmi.cz/aktualni-situace/aktualni-stav-pocasi/evropa/synopticka-situace' },
				img: 'https://intranet.chmi.cz/files/portal/docs/meteo/om/evropa/analyza.gif',
				aspect: '760 / 492'
			},
			{
				title: { text: 'ČHMÚ | Sinoptička karta', href: 'https://intranet.chmi.cz/predpovedi/predpovedi-pocasi/evropa/synopticka-situace' },
				img: 'https://intranet.chmi.cz/files/portal/docs/meteo/om/evropa/preba/preba36.gif',
				aspect: '760 / 435'
			},
			{
				title: { text: 'ČHMÚ | Sinoptička karta', href: 'https://intranet.chmi.cz/predpovedi/predpovedi-pocasi/evropa/synopticka-situace' },
				img: 'https://intranet.chmi.cz/files/portal/docs/meteo/om/evropa/preba/preba60.gif',
				aspect: '760 / 435'
			},
			{
				title: { text: 'ČHMÚ | Sinoptička karta', href: 'https://intranet.chmi.cz/predpovedi/predpovedi-pocasi/evropa/synopticka-situace' },
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
		name: 'Neverin | Kamera | Zagreb',
		type: 'image',
		title: { text: 'Neverin | Kamera | Zagreb-Remetinečki rotor', href: 'https://www.neverin.hr/kamere/' },
		aspect: '1280 / 720',
		img: 'https://webcams.neverin.hr/7332072588/latest.jpg'
	},
	{
		id: 'meteoblue-prognoza',
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
		name: 'Ventusky | Radar',
		type: 'iframe',
		frameId: 'ventusky',
		scaled: true,
		loading: 'eager',
		title: { text: 'Ventusky', href: 'https://www.ventusky.com/?p=44.5;16.5;6&l=radar&w=off' },
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
		name: 'Rain Viewer | Radar',
		type: 'iframe',
		frameId: 'rainViewer',
		scaled: true,
		title: { text: 'Rain Viewer', href: 'https://www.rainviewer.com/map.html?loc=44.5,16.5,6&oCS=1&c=5&lm=1&layer=radar&sm=1&sn=2&ts=1' },
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
		name: 'Vrijeme&Radar',
		type: 'iframe',
		frameId: 'weatherAndRadar',
		scaled: true,
		title: { text: 'Vrijeme&Radar', href: 'https://www.vrijemeradar.hr/vremenski-radar/zagreb/18138691?center=44.5,16.5&zoom=7&layer=wr&tz=Europe%2FZagreb' },
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
		name: 'meteo.si | Radar',
		type: 'slideshow',
		title: { text: 'meteo.si', href: 'https://meteo.arso.gov.si/met/sl/weather/observ/radar/' },
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
		name: 'Időkép | Radar | Europa',
		type: 'image',
		title: { text: 'Időkép | Radar | Europa', href: 'https://www.idokep.eu/ceu/radar' },
		maxWidth: 840,
		aspect: '840 / 600',
		img: 'https://www.idokep.eu/terkep/eu/radar.gif',
		links: RADAR_EU_LINKS
	},
	{
		id: 'idokep-satelit-eu',
		name: 'Időkép | Satelit | Europa',
		type: 'video',
		title: { text: 'Időkép | Satelit | Europa', href: 'https://www.idokep.hu/muhold' },
		aspect: '1070 / 713',
		src: 'https://www.idokep.hu/radar/sat-eu.mp4',
		links: SAT_EU_LINKS
	},
	/*
	{
		id: 'idokep-radar-adria',
		name: 'Időkép | Radar | Hrvatska',
		type: 'video',
		title: { text: 'Időkép | Radar | Hrvatska', href: 'https://www.idokep.eu/adria' },
		videoClass: 'vid2',
		src: 'https://www.idokep.hu/idokepradar/public_radar_adria.mp4'
	},
	*/
	{
		id: 'istramet-munje',
		name: 'Istramet | Munje',
		type: 'image',
		title: { text: 'Istramet | Munje', href: 'https://www.istramet.hr/radari-munja/' },
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
		name: 'Blitzortung.org | Munje | Europa',
		type: 'image',
		title: { text: 'Blitzortung.org | Munje', href: 'https://www.blitzortung.org/en/historical_maps.php?map=10' },
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
		name: 'Wetterzentrale | Temperatura',
		type: 'image',
		title: { text: 'Wetterzentrale | Temperatura', href: 'https://www.wetterzentrale.de/en/topkarten.php?map=17&model=ecm&var=5&run=6&time=0&lid=OP&h=1&mv=0&tr=1' },
		aspect: '959 / 741',
		img: 'https://www.wetterzentrale.de/en/create_gif.php?model=ECM&member=OP&var=5&map=IT&run=06&speed=250&times=0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47',
		alt: 'Wetterzentrale Temperatura',
		links: TEMP_HR_LINKS
	},
	{
		id: 'dhmz-sinopticka',
		name: 'DHMZ | Sinoptička karta',
		type: 'image',
		title: { text: 'DHMZ | Sinoptička karta', href: 'https://meteo.hr/prognoze.php?section=prognoze_model&param=web_fronte_sutra12' },
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

const PAGE_DEFAULT_MAPS = {
	index: [
		'neverin-radar-hr', 'neverin-satelit-hr', 'neverin-radar-eu', 'neverin-satelit-eu',
		'windy', 'dhmz-radar', 'meteociel-temp', 'blitzortung', 'essl', 'astorp', 'estofex',
		'eumetnet', 'meteociel-satelit', 'chmi-sinopticka', 'neverin-kamera', 'meteoblue-prognoza'
	],
	extras: [
		'ventusky', 'rainviewer', 'weatherandradar', 'meteo-si', 'idokep-radar-eu',
		'idokep-satelit-eu', /* 'idokep-radar-adria', */ 'istramet-munje', 'blitzortung-karta', 'wetterzentrale-temp',
		'dhmz-sinopticka', 'dhmz-puntijarka', 'dhmz-bilogora', 'dhmz-gradiste', 'dhmz-goli',
		'dhmz-debeljak', 'dhmz-uljenje'
	]
};

const MAP_PRESETS = [
	{ id: 'zadano', name: 'Zadano' },
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
	{ id: 'sve', name: 'Sve' }
];

// ---------- preferences (localStorage) ----------

function mapPrefsKey(page) {
	return `mapPrefs-${page}`;
}

function getMapPrefs(page) {
	try {
		const prefs = JSON.parse(localStorage.getItem(mapPrefsKey(page)));
		if (prefs && typeof prefs.preset === 'string') return prefs;
	} catch (e) { /* corrupt storage falls through to default */ }
	return { preset: 'zadano' };
}

function saveMapPrefs(page, prefs) {
	localStorage.setItem(mapPrefsKey(page), JSON.stringify(prefs));
}

function presetMapIds(presetId, page) {
	if (presetId === 'zadano') return PAGE_DEFAULT_MAPS[page] || PAGE_DEFAULT_MAPS.index;
	if (presetId === 'sve') return MAP_CATALOG.map(map => map.id);
	const preset = MAP_PRESETS.find(p => p.id === presetId);
	return preset ? preset.maps : null;
}

function resolveMapIds(page) {
	const prefs = getMapPrefs(page);
	if (prefs.preset === 'custom' && Array.isArray(prefs.maps))
		return prefs.maps.filter(id => MAP_CATALOG.some(map => map.id === id));
	return presetMapIds(prefs.preset, page) || presetMapIds('zadano', page);
}

function getMapsPage() {
	const tbody = document.querySelector('tbody[data-maps]');
	return tbody ? (tbody.getAttribute('data-page') || 'index') : 'index';
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

function buildTitleBar(title, map) {
	return el('div', { class: 'radartitle', style: maxWidthStyle(map) || undefined }, [
		el('a', { href: title.href, target: '_blank', rel: 'nofollow', text: title.text })
	]);
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
			slideDiv.appendChild(buildTitleBar(slide.title, {}));
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

	return [map.title ? buildTitleBar(map.title, map) : null, container, indicators];
}

function buildImage(map) {
	return [
		buildTitleBar(map.title, map),
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
		buildTitleBar(map.title, map),
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
		el('a', { class: 'center', href: map.title.href, target: '_blank', rel: 'nofollow', text: map.title.text }),
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
		buildTitleBar(map.title, map),
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
	const page = tbody.getAttribute('data-page') || 'index';
	tbody.replaceChildren();
	resolveMapIds(page).forEach((id, i) => {
		const map = MAP_CATALOG.find(m => m.id === id);
		if (!map) return;
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

function toggleMapSettings() {
	const panel = document.getElementById('mapSettings');
	if (!panel) return;
	if (panel.hidden) {
		buildMapSettings(panel);
		panel.hidden = false;
	} else {
		panel.hidden = true;
	}
}

function buildMapSettings(panel) {
	const page = getMapsPage();
	const prefs = getMapPrefs(page);
	panel.replaceChildren();

	const listDiv = el('div', { class: 'ms-list' });

	function markCustom() {
		panel.querySelector('input[name="msPreset"][value="custom"]').checked = true;
	}

	function fillList(selectedIds) {
		listDiv.replaceChildren();
		const orderedIds = [
			...selectedIds,
			...MAP_CATALOG.map(map => map.id).filter(id => !selectedIds.includes(id))
		];
		orderedIds.forEach(id => {
			const map = MAP_CATALOG.find(m => m.id === id);
			if (!map) return;
			const checkbox = el('input', { type: 'checkbox' });
			checkbox.checked = selectedIds.includes(id);
			checkbox.addEventListener('change', markCustom);
			const up = el('a', { text: '▲', title: 'Pomakni gore' });
			const down = el('a', { text: '▼', title: 'Pomakni dolje' });
			const row = el('div', { class: 'ms-item', 'data-map-id': id }, [
				el('label', {}, [checkbox, document.createTextNode(' ' + map.name)]),
				el('span', { class: 'ms-arrows' }, [up, down])
			]);
			up.addEventListener('click', () => {
				if (row.previousElementSibling) {
					listDiv.insertBefore(row, row.previousElementSibling);
					markCustom();
				}
			});
			down.addEventListener('click', () => {
				if (row.nextElementSibling) {
					listDiv.insertBefore(row.nextElementSibling, row);
					markCustom();
				}
			});
			listDiv.appendChild(row);
		});
	}

	const presetsDiv = el('div', { class: 'ms-presets' });
	const presetOptions = [...MAP_PRESETS, { id: 'custom', name: 'Prilagođeno' }];
	presetOptions.forEach(preset => {
		const radio = el('input', { type: 'radio', name: 'msPreset', value: preset.id });
		radio.checked = prefs.preset === preset.id;
		radio.addEventListener('change', () => {
			// switching to a named preset previews its list; "custom" keeps the current list
			if (preset.id !== 'custom') fillList(presetMapIds(preset.id, page));
		});
		presetsDiv.appendChild(el('label', {}, [radio, document.createTextNode(' ' + preset.name)]));
	});

	fillList(resolveMapIds(page));

	const applyBtn = el('button', { type: 'button', class: 'btn', text: 'Primijeni' });
	applyBtn.addEventListener('click', () => {
		const checked = panel.querySelector('input[name="msPreset"]:checked');
		const presetId = checked ? checked.value : 'zadano';
		if (presetId === 'custom') {
			const ids = [...listDiv.querySelectorAll('.ms-item')]
				.filter(row => row.querySelector('input[type="checkbox"]').checked)
				.map(row => row.getAttribute('data-map-id'));
			saveMapPrefs(page, { preset: 'custom', maps: ids });
		} else {
			saveMapPrefs(page, { preset: presetId });
		}
		panel.hidden = true;
		renderMaps();
		initDynamicContent();
	});

	panel.appendChild(presetsDiv);
	panel.appendChild(listDiv);
	panel.appendChild(el('div', { class: 'ms-actions' }, [applyBtn]));
}

renderMaps();
