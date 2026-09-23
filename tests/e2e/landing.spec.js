// The landing page: a fixed list of maps, the slideshows, the interactive
// maps' gate and buttons, the links and the remote on/off switch
import { test, expect } from './fixtures.js';

test.describe('landing page', () => {
	test.beforeEach(async ({ page, paths }) => {
		await page.goto(paths.landing);
	});

	test('shows the fixed list of maps', async ({ page }) => {
		await expect(page.locator('tr[data-map-id="neverin-radar-hr"]').first()).toBeVisible();
		await expect(page.locator('.slideshow')).toHaveCount(12);
		await expect(page.locator('iframe#windy')).toHaveAttribute('src', /embed\.windy\.com.*zoom=7/);
	});

	test('the manual is switched off: no ? button, and H does nothing', async ({ page }) => {
		await expect(page.locator('html')).toHaveClass(/no-manual/);
		await expect(page.locator('.help-btn')).toBeHidden();
		await page.keyboard.press('h');
		await expect(page.locator('#manualDialog')).toBeHidden();
	});

	test('the progress bar goes once the images are in', async ({ page }) => {
		await expect(page.locator('.progress-container')).toBeHidden();
	});

	test('slideshow arrows and indicators move together', async ({ page }) => {
		const slideshow = page.locator('.slideshow[data-slideshow-id="1"]');
		const indicators = page.locator('.indicators-container[data-slideshow-id="1"] .indicator');
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

	test('a horizontal mouse drag changes the slide', async ({ page }) => {
		const slideshow = page.locator('.slideshow[data-slideshow-id="1"]');
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
		const fs = page.locator('tr[data-map-id="windy"] .fs-btn');
		await fs.scrollIntoViewIfNeeded();
		await fs.click();
		await expect(fs).toHaveText('[-]');
		await expect(page.locator('body')).toHaveClass(/fs-lock/);
		await expect(page.locator('#overlayWindyFrame')).toBeHidden();
		await expect(page.locator('#resetWindyFrame')).toHaveText('[R]');
		await fs.click();
		await expect(fs).toHaveText('[ ]');
		await expect(page.locator('body')).not.toHaveClass(/fs-lock/);
		await expect(page.locator('#overlayWindyFrame')).toBeVisible();
		await expect(page.locator('#resetWindyFrame')).toHaveText('[R]');
	});
});

test.describe('landing page with a map switched off remotely', () => {
	test.use({ mapConfig: { maps: { windy: { enabled: false }, 'dhmz-radar': { enabled: true } } } });

	test('the map is hidden once the config arrives, and at once on the next load', async ({ page, paths }) => {
		await page.goto(paths.landing);
		await expect(page.locator('tr[data-map-id="windy"]').first()).toBeHidden();
		await expect(page.locator('tr[data-map-id="dhmz-radar"]').first()).toBeVisible();
		expect(await page.evaluate(() => localStorage.getItem('mapConfig'))).toContain('windy');
		await page.reload();
		await expect(page.locator('tr[data-map-id="windy"]').first()).toBeHidden();
	});
});
