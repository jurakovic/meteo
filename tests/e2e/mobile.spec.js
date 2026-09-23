// A phone: no widgets or board, touch gestures on the slideshows and the
// interactive maps' gate, the dialog over the whole screen
import { test, expect, storedJson } from './fixtures.js';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

// a one-finger swipe across the element, as touch events carrying Touch objects
async function swipe(locator, dx) {
	await locator.evaluate((node, dx) => {
		const r = node.getBoundingClientRect();
		const y = r.top + r.height / 2, x0 = r.left + r.width / 2;
		const touch = (x) => new Touch({ identifier: 1, target: node, clientX: x, clientY: y });
		const fire = (type, x, list) => node.dispatchEvent(new TouchEvent(type, {
			bubbles: true, cancelable: true, touches: list ? [touch(x)] : [], changedTouches: [touch(x)]
		}));
		fire('touchstart', x0, true);
		fire('touchmove', x0 + dx / 2, true);
		fire('touchmove', x0 + dx, true);
		fire('touchend', x0 + dx, false);
	}, dx);
}

test('landing: a swipe changes the slide; a double tap opens the gate', async ({ page, paths }) => {
	await page.goto(paths.landing);
	const slideshow = page.locator('.slideshow[data-slideshow-id="1"]');
	await swipe(slideshow, -120);
	await expect(slideshow).toHaveAttribute('data-current-slide', '3');
	await swipe(slideshow, 120);
	await expect(slideshow).toHaveAttribute('data-current-slide', '2');

	const overlay = page.locator('#overlayWindyFrame');
	await overlay.scrollIntoViewIfNeeded();
	await expect(overlay.locator('.hint')).toHaveText('Dvostruki dodir za pristup interaktivnoj karti');
	const b = await overlay.boundingBox();
	await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
	await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
	await expect(overlay).toBeHidden();
	await expect(page.locator('#resetWindyFrame')).toHaveText('[X]');
});

test('landing: the iframe gets the mobile zoom', async ({ page, paths }) => {
	await page.goto(paths.landing);
	await expect(page.locator('iframe#windy')).toHaveAttribute('src', /zoom=6/);
});

test('customize: no pop-out buttons, the dialog fills the screen, no mode row', async ({ page, paths }) => {
	await page.goto(paths.customize);
	await expect(page.locator('.map-block').first()).toBeVisible();
	await expect(page.locator('.po-btn').first()).toBeHidden();
	await page.locator('.buttons .ms-toggle').click();
	const panel = page.locator('#mapSettings');
	await expect(panel).toBeVisible();
	expect(Math.round((await panel.boundingBox()).width)).toBe(390);
	await expect(page.locator('#mapSettings .ms-mode')).toBeHidden();
	await expect(page.locator('#mapSettings .ms-refresh')).toBeVisible();
});

test('customize: a stored board is carried, not shown, and a phone never writes over it', async ({ page, paths }) => {
	const layout = { dashboard: true, floating: [{ id: 'windy', left: 0.1, top: 0.1, width: 0.3, height: 0.4 }] };
	await page.addInitScript(l => {
		if (!sessionStorage.getItem('seeded')) {
			localStorage.setItem('mapPrefs', JSON.stringify({ preset: 'custom', maps: ['windy', 'essl'], layout: l }));
			sessionStorage.setItem('seeded', '1');
		}
	}, layout);
	await page.goto(paths.customize);
	await expect(page.locator('.map-block')).toHaveCount(2);
	await expect(page.locator('.map-block.popout')).toHaveCount(0);
	await expect(page.locator('body')).not.toHaveClass(/dashboard/);
	await expect(page.locator('html')).not.toHaveClass(/board-boot/);
	// applying the list unchanged keeps the board in the stored view
	await page.locator('.buttons .ms-toggle').click();
	await page.locator('#mapSettings .ms-apply').click();
	expect((await storedJson(page, 'mapPrefs')).layout).toEqual(layout);
});
