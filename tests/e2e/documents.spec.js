// The changelog on both pages: the top footer's link, the C key and the
// #promjene address, in a dialog of the shared chrome
import { test, expect } from './fixtures.js';

for (const which of ['landing', 'customize']) {
	test.describe(`changelog on the ${which} page`, () => {
		test.beforeEach(async ({ page, paths }) => {
			await page.goto(paths[which]);
		});

		test('the footer link opens it, with the entries built in, and Escape closes it', async ({ page }) => {
			const dialog = page.locator('#changelogDialog');
			await page.locator('.footer-top [data-action="changelog"]').click();
			await expect(dialog).toBeVisible();
			await expect(dialog.locator('.dialog-title')).toHaveText('Povijest promjena');
			await expect(dialog.locator('.dialog-body h2').first()).toHaveText(/^\d{4}-\d{2}-\d{2}/);
			await expect(dialog.locator('.dialog-body li').first()).toBeVisible();
			await expect(page).toHaveURL(/#promjene$/);
			await page.keyboard.press('Escape');
			await expect(dialog).toBeHidden();
			await expect(page).not.toHaveURL(/#/);
		});

		test('C toggles it', async ({ page }) => {
			const dialog = page.locator('#changelogDialog');
			await page.keyboard.press('c');
			await expect(dialog).toBeVisible();
			await page.keyboard.press('c');
			await expect(dialog).toBeHidden();
		});

		test('Zatvori closes it', async ({ page }) => {
			const dialog = page.locator('#changelogDialog');
			await page.keyboard.press('c');
			await dialog.locator('.dialog-close').click();
			await expect(dialog).toBeHidden();
		});
	});
}

test('the address opens it on arrival', async ({ page, paths }) => {
	await page.goto(`${paths.landing}#promjene`);
	await expect(page.locator('#changelogDialog')).toBeVisible();
});

test('the picker opening over it shuts it and takes its address away', async ({ page, paths }) => {
	await page.goto(`${paths.customize}#promjene`);
	await expect(page.locator('#changelogDialog')).toBeVisible();
	await page.keyboard.press('k');
	await expect(page.locator('#mapSettings')).toBeVisible();
	await expect(page.locator('#changelogDialog')).toBeHidden();
	await expect(page).not.toHaveURL(/#/);
});
