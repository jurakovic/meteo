// With storage refused (a private window, a blocked site), both pages still
// work: nothing is remembered, and nothing breaks
import { test, expect } from './fixtures.js';

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		const refuse = () => { throw new DOMException('denied', 'SecurityError'); };
		Storage.prototype.getItem = refuse;
		Storage.prototype.setItem = refuse;
		Storage.prototype.removeItem = refuse;
	});
});

test('landing page: the links toggle still works', async ({ page, paths }) => {
	await page.goto(paths.landing);
	await page.locator('.links-toggle').check();
	await expect(page.locator('.links-bottom').first()).toBeVisible();
});

test('customize page: a preset applies, a widget pops out, a preset saves for the session', async ({ page, paths }) => {
	await page.goto(paths.customize);
	await page.keyboard.press('k');
	await page.locator('#mapSettings .ms-chip', { hasText: /^Sateliti$/ }).click();
	await page.keyboard.press('Enter');
	await expect(page.locator('.map-block')).toHaveCount(4);
	await page.locator('.map-block[data-inst="neverin-satelit-hr"] > .radartitle .po-btn').click();
	await expect(page.locator('.map-block[data-inst="neverin-satelit-hr"]')).toHaveClass(/popout/);
	await page.keyboard.press('k');
	await page.locator('#mapSettings .ms-manage-title a', { hasText: 'Dodaj' }).click();
	await page.locator('#mapSettings .ms-save .ms-name').fill('Samo sada');
	await page.locator('#mapSettings .ms-save .ms-name').press('Enter');
	await expect(page.locator('#mapSettings .ms-chip', { hasText: /^Samo sada$/ })).toBeVisible();
});
