// The documents on both pages, the changelog and the manual: their links,
// keys and addresses, in dialogs of the shared chrome
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

// the manual, the same way
for (const which of ['landing', 'customize']) {
	test.describe(`manual on the ${which} page`, () => {
		test.beforeEach(async ({ page, paths }) => {
			await page.goto(paths[which]);
		});

		test('the footer link opens it, with the manual built in, and Escape closes it', async ({ page }) => {
			const dialog = page.locator('#manualDialog');
			await expect(page.locator('html')).not.toHaveClass(/no-manual/);
			// the footer is its one control: the buttons above the maps carry none
			await expect(page.locator('.maps-head [data-action="manual"]')).toHaveCount(0);
			await page.locator('.footer-top [data-action="manual"]').click();
			await expect(dialog).toBeVisible();
			await expect(dialog.locator('.dialog-title')).toHaveText('Upute');
			await expect(dialog.locator('.manual-toc li').first()).toBeVisible();
			await expect(page).toHaveURL(/#upute$/);
			await page.keyboard.press('Escape');
			await expect(dialog).toBeHidden();
			await expect(page).not.toHaveURL(/#/);
		});

		test('H toggles it', async ({ page }) => {
			const dialog = page.locator('#manualDialog');
			await page.keyboard.press('h');
			await expect(dialog).toBeVisible();
			await page.keyboard.press('h');
			await expect(dialog).toBeHidden();
		});
	});
}

test('a heading link in the manual scrolls the manual, not the page', async ({ page, paths }) => {
	await page.goto(`${paths.landing}#upute`);
	const body = page.locator('#manualDialog .dialog-body');
	await expect(body).toBeVisible();
	await page.locator('#manualDialog .manual-toc a[href="#na-mobitelu"]').click();
	await expect.poll(() => body.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
	await expect(page).toHaveURL(/#upute$/);
});

test('the changelog opening over the manual takes its address over', async ({ page, paths }) => {
	await page.goto(`${paths.landing}#upute`);
	await expect(page.locator('#manualDialog')).toBeVisible();
	await page.keyboard.press('c');
	await expect(page.locator('#changelogDialog')).toBeVisible();
	await expect(page.locator('#manualDialog')).toBeHidden();
	await expect(page).toHaveURL(/#promjene$/);
});
