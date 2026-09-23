// The customize page's settings dialog: presets, the pick and order of maps,
// saved presets, share links, and the dialog window itself
import { test, expect, shownMapIds, storedJson, drag, box } from './fixtures.js';

const DEFAULT_MAPS = [
	'neverin-radar-hr', 'neverin-satelit-hr', 'neverin-radar-eu', 'neverin-satelit-eu',
	'windy', 'dhmz-radar', 'meteociel-temp', 'blitzortung', 'essl', 'astorp', 'estofex',
	'eumetnet', 'meteociel-satelit', 'dwd-sinopticka', 'neverin-kamera', 'meteoblue-prognoza'
];
const RADARI = ['neverin-radar-hr', 'neverin-radar-eu', 'windy', 'dhmz-radar', 'eumetnet', 'ventusky', 'rainviewer', 'weatherandradar', 'meteo-si', 'idokep-radar-eu'];

const chip = (page, name) => page.locator('#mapSettings .ms-chip', { hasText: new RegExp(`^${name}$`) });
const selectedIds = (page) => page.locator('#mapSettings .ms-selected .ms-item').evaluateAll(rows => rows.map(r => r.dataset.mapId));
const manageRow = (page, name) => page.locator('#mapSettings .ms-manage-item', { has: page.locator('.ms-manage-name', { hasText: new RegExp(`^${name}$`) }) });

// the link a share button offers: not a secure context, so it comes in a
// prompt to copy from rather than through the clipboard
async function promptedLink(page, button) {
	let link = null;
	page.once('dialog', dialog => { link = dialog.defaultValue(); dialog.dismiss(); });
	await button.click();
	await expect.poll(() => link).not.toBeNull();
	return link;
}

async function openDialog(page) {
	await page.keyboard.press('k');
	await expect(page.locator('#mapSettings')).toBeVisible();
}

test.describe('settings dialog', () => {
	test.beforeEach(async ({ page, paths }) => {
		await page.goto(paths.customize);
		await expect(page.locator('.map-block').first()).toBeVisible();
	});

	test('the default view is Osnovno', async ({ page }) => {
		expect(await shownMapIds(page)).toEqual(DEFAULT_MAPS);
	});

	test('K and the Karte button open it, Escape and Zatvori close it', async ({ page }) => {
		const panel = page.locator('#mapSettings');
		await openDialog(page);
		await expect(page.locator('.buttons .ms-toggle .arrow')).toHaveText('▲');
		await expect(page.locator('body')).toHaveClass(/ms-open/);
		await page.keyboard.press('Escape');
		await expect(panel).toBeHidden();
		await expect(page.locator('.buttons .ms-toggle .arrow')).toHaveText('▼');
		await page.locator('.buttons .ms-toggle').click();
		await expect(panel).toBeVisible();
		await panel.locator('.ms-head a', { hasText: 'Zatvori' }).click();
		await expect(panel).toBeHidden();
		await expect(page.locator('body')).not.toHaveClass(/ms-open/);
	});

	test('a preset applied with Enter replaces the view and is stored', async ({ page }) => {
		await openDialog(page);
		await chip(page, 'Radari').click();
		expect(await selectedIds(page)).toEqual(RADARI);
		await page.keyboard.press('Enter');
		await expect(page.locator('#mapSettings')).toBeHidden();
		expect(await shownMapIds(page)).toEqual(RADARI);
		expect(await storedJson(page, 'mapPrefs')).toEqual({ preset: 'radari' });
		await page.reload();
		expect(await shownMapIds(page)).toEqual(RADARI);
	});

	test('unticking a map makes the list custom, with a dot on where it came from', async ({ page }) => {
		await openDialog(page);
		await page.locator('#mapSettings .ms-selected .ms-item[data-map-id="windy"] input').uncheck();
		await expect(page.locator('#mapSettings input[name="msPreset"][value="custom"]')).toBeChecked();
		await expect(chip(page, 'Osnovno')).toHaveClass(/ms-origin/);
		await expect(page.locator('#mapSettings .ms-available .ms-item[data-map-id="windy"]')).toBeAttached();
		await page.locator('#mapSettings .ms-apply').click();
		const expected = DEFAULT_MAPS.filter(id => id !== 'windy');
		expect(await shownMapIds(page)).toEqual(expected);
		expect(await storedJson(page, 'mapPrefs')).toEqual({ preset: 'custom', maps: expected });
	});

	test('ticking a map appends it; the handle reorders', async ({ page }) => {
		await openDialog(page);
		await page.locator('#mapSettings .ms-available .ms-item[data-map-id="ventusky"] input').check();
		expect((await selectedIds(page)).at(-1)).toBe('ventusky');
		const handle = page.locator('#mapSettings .ms-selected .ms-item[data-map-id="neverin-satelit-hr"] .ms-handle');
		const first = await box(page.locator('#mapSettings .ms-selected .ms-item').first());
		const h = await box(handle);
		await drag(page, { x: h.cx, y: h.cy }, { x: h.cx, y: first.y + 2 });
		expect((await selectedIds(page)).slice(0, 2)).toEqual(['neverin-satelit-hr', 'neverin-radar-hr']);
		await page.locator('#mapSettings .ms-apply').click();
		const shown = await shownMapIds(page);
		expect(shown.slice(0, 2)).toEqual(['neverin-satelit-hr', 'neverin-radar-hr']);
		expect(shown.at(-1)).toBe('ventusky');
	});

	test('the find box narrows the available list, diacritics folded', async ({ page }) => {
		await openDialog(page);
		const visible = () => page.locator('#mapSettings .ms-available .ms-item:not(.ms-filtered)').evaluateAll(rows => rows.map(r => r.dataset.mapId));
		await page.locator('#mapSettings .ms-find-input').fill('chmu');
		expect(await visible()).toEqual(['chmi-sinopticka']);
		await page.locator('#mapSettings .ms-find-input').fill('gradiste');
		expect(await visible()).toEqual(['dhmz-gradiste']);
		await page.locator('#mapSettings .ms-find-input').fill('idokep radar');
		expect(await visible()).toEqual(['idokep-radar-eu']);
		await page.locator('#mapSettings .ms-find-input').press('Escape'); // clears the term first
		await expect(page.locator('#mapSettings')).toBeVisible();
		expect((await visible()).length).toBeGreaterThan(10);
	});

	test('the available list sorts by name', async ({ page }) => {
		await openDialog(page);
		await page.locator('#mapSettings .ms-sort a', { hasText: 'Naziv' }).click();
		const names = await page.locator('#mapSettings .ms-available .ms-item label').evaluateAll(labels => labels.map(l => l.lastChild.textContent));
		const sorted = [...names].sort((a, b) => a.localeCompare(b, 'hr'));
		expect(names).toEqual(sorted);
		await expect(page.locator('#mapSettings .ms-sort a.active')).toHaveText('Naziv ▲');
	});

	test('closing without Primijeni drops the edits', async ({ page }) => {
		await openDialog(page);
		await chip(page, 'Sateliti').click();
		await page.mouse.click(5, 450); // on the backdrop
		await expect(page.locator('#mapSettings')).toBeHidden();
		expect(await shownMapIds(page)).toEqual(DEFAULT_MAPS);
		await openDialog(page);
		await expect(page.locator('#mapSettings input[name="msPreset"][value="zadano"]')).toBeChecked();
	});

	test('saved presets: save, select, update, rename, delete', async ({ page }) => {
		await openDialog(page);
		await chip(page, 'Sateliti').click();
		await page.locator('#mapSettings .ms-manage-title a', { hasText: 'Dodaj' }).click();
		await page.locator('#mapSettings .ms-save .ms-name').fill('Moji sateliti');
		await page.locator('#mapSettings .ms-save .ms-name').press('Enter');
		await expect(chip(page, 'Moji sateliti')).toBeVisible();
		const saved = await storedJson(page, 'mapUserPresets');
		expect(saved).toHaveLength(1);
		expect(saved[0]).toMatchObject({ name: 'Moji sateliti', maps: ['neverin-satelit-hr', 'neverin-satelit-eu', 'meteociel-satelit', 'idokep-satelit-eu'] });
		expect(saved[0].id).toMatch(/^u:/);

		// an edit of the list offers Ažuriraj on that preset's row
		await page.locator('#mapSettings .ms-selected .ms-item[data-map-id="meteociel-satelit"] input').uncheck();
		await manageRow(page, 'Moji sateliti').locator('a', { hasText: 'Ažuriraj' }).click();
		expect((await storedJson(page, 'mapUserPresets'))[0].maps).not.toContain('meteociel-satelit');

		await page.locator('#mapSettings .ms-apply').click();
		expect(await storedJson(page, 'mapPrefs')).toEqual({ preset: saved[0].id });

		await openDialog(page);
		await manageRow(page, 'Moji sateliti').locator('a', { hasText: 'Preimenuj' }).click();
		await page.locator('#mapSettings .ms-rename').fill('Sat');
		await page.locator('#mapSettings .ms-rename').press('Enter');
		await expect(chip(page, 'Sat')).toBeVisible();

		const del = manageRow(page, 'Sat').locator('a', { hasText: 'Obriši' });
		await del.click();
		await expect(manageRow(page, 'Sat').locator('a.active')).toHaveText('Sigurno?');
		await manageRow(page, 'Sat').locator('a.active').click();
		await expect(chip(page, 'Sat')).toHaveCount(0);
		expect(await storedJson(page, 'mapUserPresets')).toEqual([]);
		// the view that was on screen stays, as a custom list
		expect(await storedJson(page, 'mapPrefs')).toMatchObject({ preset: 'custom' });
	});

	test('built-in presets can be hidden and shown again', async ({ page }) => {
		await openDialog(page);
		await manageRow(page, 'Radari').locator('a', { hasText: 'Sakrij' }).click();
		await expect(chip(page, 'Radari')).toHaveCount(0);
		expect(await storedJson(page, 'mapHiddenPresets')).toEqual(['radari']);
		await page.locator('#mapSettings .ms-manage-title a', { hasText: 'Sakrij sve' }).click();
		await expect(page.locator('#mapSettings .ms-chip')).toHaveText(['Osnovno', 'Prilagođeno']);
		await page.locator('#mapSettings .ms-manage-title a', { hasText: 'Prikaži sve' }).click();
		await expect(chip(page, 'Radari')).toBeVisible();
	});

	test('a share link carries the view, and a shared saved preset can be saved', async ({ page, paths }) => {
		await openDialog(page);
		await chip(page, 'Nevrijeme').click();
		await page.locator('#mapSettings .ms-selected .ms-item[data-map-id="astorp"] input').uncheck();
		const link = await promptedLink(page, page.locator('#mapSettings .ms-actions a', { hasText: 'Podijeli' }));
		expect(link).toContain(`${paths.customize}?v=`);

		await page.goto(link);
		expect(await shownMapIds(page)).toEqual(['essl', 'estofex', 'blitzortung', 'istramet-munje', 'blitzortung-karta']);
		expect(await storedJson(page, 'mapPrefs')).toBeNull(); // a shared view never writes the recipient's own

		// a saved preset travels with its name, which the recipient can save under
		await page.evaluate(() => localStorage.clear());
		await page.goto(paths.customize);
		await openDialog(page);
		await chip(page, 'Sateliti').click();
		await page.locator('#mapSettings .ms-manage-title a', { hasText: 'Dodaj' }).click();
		await page.locator('#mapSettings .ms-save .ms-name').fill('Čist nebo');
		await page.locator('#mapSettings .ms-save button').click();
		const link2 = await promptedLink(page, manageRow(page, 'Čist nebo').locator('a', { hasText: 'Podijeli' }));
		await page.evaluate(() => localStorage.clear());
		await page.goto(link2);
		await openDialog(page);
		await expect(page.locator('#mapSettings .ms-shared')).toContainText('Podijeljen predložak "Čist nebo"');
		await page.locator('#mapSettings .ms-shared a', { hasText: 'Spremi' }).click();
		await expect(chip(page, 'Čist nebo')).toBeVisible();
		await expect(page.locator('#mapSettings .ms-shared')).toHaveCount(0);
	});

	test('a hand-crafted link with duplicates and unknown ids is cleaned', async ({ page, paths }) => {
		const v = await page.evaluate(() => btoa(JSON.stringify({ preset: 'custom', maps: ['windy', 'nope', 'windy', 'essl'] })));
		await page.goto(`${paths.customize}?v=${v}`);
		expect(await shownMapIds(page)).toEqual(['windy', 'essl']);
		await page.goto(`${paths.customize}?v=not-base64!`);
		expect(await shownMapIds(page)).toEqual(DEFAULT_MAPS);
	});

	test('the dialog window moves by its head, is remembered, and a double click resets it', async ({ page }) => {
		await openDialog(page);
		const panel = page.locator('#mapSettings');
		const title = await box(page.locator('#mapSettings .ms-title'));
		const before = await box(panel);
		await drag(page, { x: title.right + 40, y: title.cy }, { x: title.right - 160, y: title.cy + 60 });
		const after = await box(panel);
		expect(Math.round(after.x - before.x)).toBe(-200);
		expect(Math.round(after.y - before.y)).toBe(60);
		expect(await storedJson(page, 'msPanel')).toMatchObject({ width: Math.round(before.width) });
		await page.keyboard.press('Escape');
		await openDialog(page);
		expect(Math.round((await box(panel)).x)).toBe(Math.round(after.x));
		const head = await box(page.locator('#mapSettings .ms-title'));
		await page.mouse.dblclick(head.right + 40, head.cy);
		expect(await storedJson(page, 'msPanel')).toBeNull();
		expect(Math.round((await box(panel)).x)).toBe(Math.round(before.x));
	});

	test('the east handle resizes the dialog', async ({ page }) => {
		await openDialog(page);
		const panel = page.locator('#mapSettings');
		const before = await box(panel);
		await drag(page, { x: before.right - 1, y: before.cy }, { x: before.right + 99, y: before.cy });
		expect(Math.round((await box(panel)).width - before.width)).toBe(100);
	});
});

test.describe('settings dialog with a map switched off remotely', () => {
	test.use({ mapConfig: { maps: { windy: { enabled: false } } } });

	test('the map is left out of the render and hidden in the dialog, but kept in the list', async ({ page, paths }) => {
		await page.goto(paths.customize);
		await expect.poll(() => shownMapIds(page)).toEqual(DEFAULT_MAPS.filter(id => id !== 'windy'));
		await openDialog(page);
		await expect(page.locator('#mapSettings .ms-selected .ms-item[data-map-id="windy"]')).toHaveClass(/ms-off/);
		await page.locator('#mapSettings .ms-selected .ms-item[data-map-id="essl"] input').uncheck();
		await page.locator('#mapSettings .ms-apply').click();
		expect((await storedJson(page, 'mapPrefs')).maps).toContain('windy');
	});
});
