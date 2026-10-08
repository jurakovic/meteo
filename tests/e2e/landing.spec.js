// The landing page: a fixed list of maps, the slideshows, the interactive
// maps' gate and buttons, the links and the remote on/off switch
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { test, expect, countRowsRemoved } from './fixtures.js';

test.describe('landing page', () => {
	test.beforeEach(async ({ page, paths }) => {
		await page.goto(paths.landing);
	});

	test('shows the fixed list of maps', async ({ page }) => {
		await expect(page.locator('.map-block[data-map-id="neverin-radar-hr"]').first()).toBeVisible();
		await expect(page.locator('.slideshow')).toHaveCount(13);
		await expect(page.locator('iframe#windy')).toHaveAttribute('src', /embed\.windy\.com.*zoom=7/);
		// the default view, drawn from the catalog, without the widgets
		await expect(page.locator('.map-block')).toHaveCount(17);
		await expect(page.locator('.po-btn, .dup-btn, .grp-btn, .rl-btn')).toHaveCount(0);
	});

	test('the progress bar goes once the images are in', async ({ page }) => {
		await expect(page.locator('.progress-container')).toBeHidden();
	});

	test('the bar ends at 100%: an image counts once, even one complete before its load event has run', async ({ page }) => {
		await expect(page.locator('.progress-container')).toBeHidden();
		expect(await page.locator('.progress-bar').evaluate(bar => parseFloat(bar.style.width))).toBe(100);
	});

	test('slideshow arrows and indicators move together', async ({ page }) => {
		const slideshow = page.locator('.slideshow[data-slideshow-id="neverin-radar-hr"]');
		const indicators = page.locator('.indicators-container[data-slideshow-id="neverin-radar-hr"] .indicator');
		await expect(slideshow).toHaveAttribute('data-current-slide', '2');
		await slideshow.locator('.next').click();
		await expect(slideshow).toHaveAttribute('data-current-slide', '3');
		await expect(indicators.nth(2)).toHaveClass(/active/);
		await slideshow.locator('.next').click(); // wraps round
		await expect(slideshow).toHaveAttribute('data-current-slide', '1');
		await slideshow.locator('.prev').click();
		await expect(slideshow).toHaveAttribute('data-current-slide', '3');
		await expect(slideshow.locator('.slide.active img')).toHaveAttribute('src', /anim_6h/);
	});

	test('every meteogram widget is laid out at full size, its slide shown or not', async ({ page }) => {
		const frames = page.locator('.slideshow[data-slideshow-id="meteoblue-prognoza"] iframe');
		await expect(frames).toHaveCount(4);
		const sizes = await frames.evaluateAll(list => list.map(f => [f.clientWidth, f.clientHeight, f.getAttribute('src')]));
		expect(sizes[0][0]).toBeGreaterThan(0);
		expect(sizes.map(([w, h]) => [w, h])).toEqual(sizes.map(() => [sizes[0][0], sizes[0][1]]));
		sizes.forEach(([, , src]) => expect(src).toMatch(/meteoblue\.com\/.*widget\/meteogram/));
	});

	test('a meteogram widget is behind the gate: a double click lets it through, [X] and [R] put it back', async ({ page }) => {
		const slideshow = page.locator('.slideshow[data-slideshow-id="meteoblue-prognoza"]');
		await slideshow.locator('.next').click();
		const slide = slideshow.locator('.slide.active');
		const overlay = slide.locator('.overlay');
		const gate = slide.locator('a[data-action="gate"]');
		await expect(gate).toBeHidden();
		await overlay.dblclick();
		await expect(overlay).toBeHidden();
		await expect(gate).toHaveText('[X]');
		await gate.click();
		await expect(overlay).toBeVisible();
		await expect(gate).toHaveText('[R]');
		await gate.click();
		await expect(gate).toBeHidden();
		await expect(slide.locator('iframe')).toHaveAttribute('src', /split_croatia/);
	});

	test('a vector slideshow\'s image fills its slide, past its natural size', async ({ page }) => {
		// Yr's meteogram at its own size, narrower than the column
		const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="782" height="391"><rect width="782" height="391" fill="#3a6"/></svg>';
		await page.route(url => url.hostname === 'www.yr.no', route => route.fulfill({ contentType: 'image/svg+xml', body: svg }));
		await page.reload();
		const slide = page.locator('.slideshow[data-slideshow-id="yr-prognoza"] .slide.active');
		await expect(slide.locator('img')).toHaveJSProperty('complete', true);
		const [img, box, natural] = await slide.locator('.placeholder').evaluate(p => [p.firstElementChild.clientWidth, p.clientWidth, p.firstElementChild.naturalWidth]);
		expect(box).toBeGreaterThan(natural);
		expect(img).toBe(box);
	});

	test('a horizontal mouse drag changes the slide', async ({ page }) => {
		const slideshow = page.locator('.slideshow[data-slideshow-id="neverin-radar-hr"]');
		await slideshow.scrollIntoViewIfNeeded();
		const b = await slideshow.boundingBox();
		await page.mouse.move(b.x + b.width / 2 + 100, b.y + b.height / 2);
		await page.mouse.down();
		await page.mouse.move(b.x + b.width / 2 - 100, b.y + b.height / 2, { steps: 5 });
		await page.mouse.up();
		await expect(slideshow).toHaveAttribute('data-current-slide', '3');
	});

	test('the links toggle shows the links under each map and is remembered', async ({ page }) => {
		const bar = page.locator('.links-bottom').first();
		await expect(bar).toBeHidden();
		await page.locator('.links-toggle').check();
		await expect(bar).toBeVisible();
		expect(await page.evaluate(() => localStorage.getItem('showLinksBottom'))).toBe('1');
		await page.reload();
		await expect(page.locator('.links-toggle')).toBeChecked();
		await expect(bar).toBeVisible();
	});

	test('the Linkovi section expands', async ({ page }) => {
		const links = page.locator('.links');
		await expect(links.locator('a').first()).toBeAttached(); // included in dev, inlined when built
		await page.locator('.expandable').click();
		await expect(page.locator('.expandable .arrow')).toHaveText('▲');
		await expect.poll(() => links.evaluate(node => parseFloat(node.style.maxHeight))).toBeGreaterThan(100);
		await page.locator('.expandable').click();
		await expect(page.locator('.expandable .arrow')).toHaveText('▼');
	});

	test('the interactive map gate: double click, [X], [R]', async ({ page }) => {
		const overlay = page.locator('#overlayWindyFrame');
		const reset = page.locator('#resetWindyFrame');
		await overlay.scrollIntoViewIfNeeded();
		await expect(reset).toBeHidden();
		await overlay.dblclick();
		await expect(overlay).toBeHidden();
		await expect(reset).toHaveText('[X]');
		await expect(reset).toBeVisible();
		await reset.click(); // the gate goes back up, and [X] becomes [R]
		await expect(overlay).toBeVisible();
		await expect(reset).toHaveText('[R]');
		await reset.click(); // reloads the map and hides itself
		await expect(reset).toBeHidden();
		await overlay.dblclick();
		await expect(reset).toHaveText('[X]');
		await reset.click();
		await expect(reset).toHaveText('[R]');
		await page.locator('.zoom-btn').first().click(); // the map is at its start again: [R] goes
		await expect(reset).toBeHidden();
	});

	test('the zoom button switches between Croatia and Europe', async ({ page }) => {
		const zoom = page.locator('.zoom-btn').first();
		await zoom.scrollIntoViewIfNeeded();
		await zoom.click();
		await expect(zoom).toHaveText('[EU]');
		await expect(page.locator('iframe#windy')).toHaveAttribute('src', /lat=48\.0.*zoom=5/);
		await zoom.click();
		await expect(zoom).toHaveText('[HR]');
		await expect(page.locator('iframe#windy')).toHaveAttribute('src', /lat=44\.5.*zoom=7/);
	});

	test('fullscreen opens over the page, drops the gate and restores it on exit', async ({ page }) => {
		const fs = page.locator('.map-block[data-map-id="windy"] .fs-btn');
		await fs.scrollIntoViewIfNeeded();
		await fs.click();
		await expect(fs).toHaveText('[-]');
		await expect(page.locator('body')).toHaveClass(/fs-lock/);
		await expect(page.locator('#overlayWindyFrame')).toBeHidden();
		await expect(page.locator('#resetWindyFrame')).toHaveText('[R]');
		await page.locator('#resetWindyFrame').click(); // reloads the map and stays, in fullscreen
		await expect(page.locator('#resetWindyFrame')).toBeVisible();
		await fs.click();
		await expect(fs).toHaveText('[ ]');
		await expect(page.locator('body')).not.toHaveClass(/fs-lock/);
		await expect(page.locator('#overlayWindyFrame')).toBeVisible();
		await expect(page.locator('#resetWindyFrame')).toHaveText('[R]');
	});

	test('Escape leaves a fullscreen map (B4)', async ({ page }) => {
		const fs = page.locator('.map-block[data-map-id="windy"] .fs-btn');
		await fs.scrollIntoViewIfNeeded();
		await fs.click();
		await expect(page.locator('body')).toHaveClass(/fs-lock/);
		await page.keyboard.press('Escape');
		await expect(fs).toHaveText('[ ]');
		await expect(page.locator('body')).not.toHaveClass(/fs-lock/);
	});
});

test.describe('landing page as built', () => {
	test.beforeEach(({ paths }) => {
		test.skip(paths.landing === '/', 'the dev page draws its maps in the browser');
	});

	test.describe('without scripts', () => {
		test.use({ javaScriptEnabled: false });

		test('carries the default maps in its markup', async ({ page, paths }) => {
			await page.goto(paths.landing);
			await expect(page.locator('.map-block')).toHaveCount(17);
			await expect(page.locator('.slideshow[data-slideshow-id="neverin-radar-hr"] .slide.active img')).toBeVisible();
			await expect(page.locator('iframe#windy')).toBeAttached();
		});
	});

	test('keeps the rows the build put in while nothing is switched off', async ({ page, paths }) => {
		// the first row as parsed, before the page's own script has run
		await page.addInitScript(() => {
			document.addEventListener('DOMContentLoaded', () => {
				window.builtRow = document.querySelector('[data-maps] > .map-entry');
			});
		});
		await page.goto(paths.landing);
		await expect(page.locator('.progress-container')).toBeHidden();
		expect(await page.evaluate(() => !!window.builtRow && window.builtRow.isConnected)).toBe(true);
	});

	test.describe('with the config arriving while the list is still being parsed', () => {
		test.use({ mapConfig: { maps: { 'chmi-sinopticka': { enabled: false } } } });

		// the built page sent in two parts, a pause between them inside the map
		// list, as a large page comes over the network: the config fetched from
		// <head> lands while only some of the rows are in
		let server;
		test.beforeAll(async () => {
			const html = await readFile(new URL('../../docs/index.html', import.meta.url), 'utf8');
			const cut = html.indexOf('<div class="map-entry">', html.indexOf('<div class="map-entry">') + 1);
			server = createServer((req, res) => {
				if (req.url !== '/meteo/') return res.writeHead(404).end();
				res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
				res.write(html.slice(0, cut));
				setTimeout(() => res.end(html.slice(cut)), 1000);
			});
			await new Promise(done => server.listen(0, '127.0.0.1', done));
		});
		test.afterAll(() => new Promise(done => server.close(done)));

		test('the list is drawn once, from the whole of the markup', async ({ page }) => {
			await countRowsRemoved(page);
			await page.goto(`http://meteo.test:${server.address().port}/meteo/`);
			await expect.poll(() => page.evaluate(() => localStorage.getItem('mapConfig'))).toContain('chmi-sinopticka');
			await expect(page.locator('.progress-container')).toBeHidden();
			await expect(page.locator('.map-block')).toHaveCount(17);
			expect(await page.evaluate(() => window.rowsRemoved)).toBe(0);
		});
	});
});

test.describe('landing page with a map switched off remotely', () => {
	test.use({ mapConfig: { maps: { windy: { enabled: false }, 'dhmz-radar': { enabled: true } } } });

	test('the map is hidden once the config arrives, and at once on the next load', async ({ page, paths }) => {
		await page.goto(paths.landing);
		await expect(page.locator('.map-block[data-map-id="windy"]')).toHaveCount(0); // left out, not just hidden
		await expect(page.locator('.map-block[data-map-id="dhmz-radar"]').first()).toBeVisible();
		expect(await page.evaluate(() => localStorage.getItem('mapConfig'))).toContain('windy');
		await page.reload();
		await expect(page.locator('.map-block[data-map-id="windy"]')).toHaveCount(0);
	});
});

test.describe('landing page with a map it does not show switched off remotely', () => {
	test.use({ mapConfig: { maps: { 'chmi-sinopticka': { enabled: false } } } });

	test('a first visit draws the list once: the config arriving changes none of its maps', async ({ page, paths }) => {
		await countRowsRemoved(page);
		await page.goto(paths.landing);
		await expect.poll(() => page.evaluate(() => localStorage.getItem('mapConfig'))).toContain('chmi-sinopticka');
		await expect(page.locator('.progress-container')).toBeHidden();
		expect(await page.evaluate(() => window.rowsRemoved)).toBe(0);
	});
});
