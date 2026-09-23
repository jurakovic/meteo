// The dashboard: every map a widget tiled over the whole window, the tab's
// glyphs and [+] menu, the grid, seams, the keys and the auto-refresh
import { test, expect, storedJson, drag, box } from './fixtures.js';

const block = (page, inst) => page.locator(`.map-block[data-inst="${inst}"]`);

async function openDialog(page) {
	await page.keyboard.press('k');
	await expect(page.locator('#mapSettings')).toBeVisible();
}

async function enterBoard(page, preset = null) {
	await openDialog(page);
	if (preset) await page.locator('#mapSettings .ms-chip', { hasText: new RegExp(`^${preset}$`) }).click();
	await page.locator('#mapSettings .ms-mode button', { hasText: 'Nadzorna ploča' }).click();
	await page.locator('#mapSettings .ms-apply').click();
	await expect(page.locator('body')).toHaveClass(/dashboard/);
}

async function widgetBoxes(page) {
	return page.locator('.map-block.popout').evaluateAll(blocks => blocks.map(b => {
		const r = b.getBoundingClientRect();
		return { id: b.dataset.inst, left: r.left, top: r.top, right: r.right, bottom: r.bottom };
	}));
}

function overlaps(a, b) {
	return a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
}

test.describe('dashboard', () => {
	test.beforeEach(async ({ page, paths }) => {
		await page.goto(paths.customize);
		await expect(block(page, 'neverin-radar-hr')).toBeVisible();
	});

	test('the board tiles every map over the whole window, and survives a reload', async ({ page }) => {
		await enterBoard(page, 'Sateliti');
		const boxes = await widgetBoxes(page);
		expect(boxes).toHaveLength(4);
		const vw = await page.evaluate(() => document.documentElement.clientWidth);
		for (let i = 0; i < boxes.length; i++)
			for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i], boxes[j])).toBe(false);
		expect(Math.min(...boxes.map(b => b.left))).toBe(0);
		expect(Math.round(Math.max(...boxes.map(b => b.right)))).toBe(vw);
		expect(Math.min(...boxes.map(b => b.top))).toBe(0);
		expect(Math.round(Math.max(...boxes.map(b => b.bottom)))).toBe(900);
		await expect(page.locator('.ms-tab')).toBeVisible();
		const layout = (await storedJson(page, 'mapPrefs')).layout;
		expect(layout.dashboard).toBe(true);
		expect(layout.floating).toHaveLength(4);
		await page.reload();
		await expect(page.locator('body')).toHaveClass(/dashboard/);
		await expect(page.locator('html')).not.toHaveClass(/board-boot/);
		expect(await widgetBoxes(page)).toEqual(boxes);
	});

	test('a big list tiles too', async ({ page }) => {
		await enterBoard(page);
		const boxes = await widgetBoxes(page);
		expect(boxes).toHaveLength(16);
		for (let i = 0; i < boxes.length; i++)
			for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i], boxes[j])).toBe(false);
	});

	test('[x] takes a map off the board and the list; the tab\'s [+] puts one on', async ({ page }) => {
		await enterBoard(page, 'Sateliti');
		const po = block(page, 'meteociel-satelit').locator('.po-btn').first();
		await expect(po).toHaveText('[x]');
		await po.click();
		await expect(block(page, 'meteociel-satelit')).toHaveCount(0);
		expect(await storedJson(page, 'mapPrefs')).toMatchObject({ preset: 'custom', maps: ['neverin-satelit-hr', 'neverin-satelit-eu', 'idokep-satelit-eu'] });

		await page.locator('.ms-tab .ms-tab-add').click();
		const menu = page.locator('.ms-add');
		await expect(menu).toBeVisible();
		await expect(menu.locator('.ms-add-item[data-map-id="neverin-satelit-hr"]')).toHaveCount(0); // on the board already
		await menu.locator('input').fill('ventus');
		await expect(menu.locator('.ms-add-item')).toHaveCount(1);
		await menu.locator('input').press('Enter');
		await expect(menu).toHaveCount(0);
		await expect(block(page, 'ventusky')).toHaveClass(/popout/);
		expect((await storedJson(page, 'mapPrefs')).maps.at(-1)).toBe('ventusky');
		expect((await storedJson(page, 'mapPrefs')).layout.floating.map(f => f.id)).toContain('ventusky');
	});

	test('G and S switch the grid; a snapped drag lands on the lines', async ({ page }) => {
		await enterBoard(page, 'Sateliti');
		await page.keyboard.press('g');
		await expect(page.locator('.po-grid')).toBeVisible();
		await page.keyboard.press('s');
		expect(await storedJson(page, 'mapGrid')).toEqual({ show: true, snap: true });
		await expect(page.locator('.ms-tab [data-grid="show"]')).not.toHaveClass(/ms-tab-off/);
		const w = block(page, 'neverin-satelit-hr');
		const b = await box(w.locator(':scope > .radartitle'));
		await drag(page, { x: b.x + 8, y: b.cy }, { x: b.x + 8 + 107, y: b.cy + 203 });
		const r = await box(w);
		expect(r.x % 16).toBe(0);
		expect(r.y % 16).toBe(0);
		await page.keyboard.press('g');
		await expect(page.locator('.po-grid')).toHaveCount(0);
	});

	test('G with the dialog open: its grid tick follows the key', async ({ page }) => {
		await enterBoard(page, 'Sateliti');
		await openDialog(page);
		const tick = page.locator('#mapSettings .ms-grid', { hasText: 'Prikaži mrežu' }).locator('input');
		await expect(tick).not.toBeChecked();
		await page.keyboard.press('g');
		await expect(tick).toBeChecked();
		await expect(page.locator('.ms-tab [data-grid="show"]')).not.toHaveClass(/ms-tab-off/);
		await tick.uncheck(); // and the other way: the tab follows the tick
		await expect(page.locator('.ms-tab [data-grid="show"]')).toHaveClass(/ms-tab-off/);
	});

	test('A tiles the board again after a widget was moved', async ({ page }) => {
		await enterBoard(page, 'Sateliti');
		const tiled = await widgetBoxes(page);
		const b = await box(block(page, 'neverin-satelit-hr').locator(':scope > .radartitle'));
		await drag(page, { x: b.x + 8, y: b.cy }, { x: b.x + 200, y: b.cy + 150 });
		expect(await widgetBoxes(page)).not.toEqual(tiled);
		await page.keyboard.press('a');
		expect(await widgetBoxes(page)).toEqual(tiled);
	});

	test('a seam between two tiles moves as one', async ({ page }) => {
		await enterBoard(page, 'Sateliti');
		const [a, b] = (await widgetBoxes(page)).sort((p, q) => p.top - q.top || p.left - q.left);
		expect(Math.abs(a.right - b.left)).toBeLessThan(1);
		const handle = await box(block(page, a.id).locator('.po-h-e'));
		await drag(page, { x: handle.cx, y: handle.cy }, { x: handle.cx + 40, y: handle.cy });
		const after = Object.fromEntries((await widgetBoxes(page)).map(w => [w.id, w]));
		expect(Math.round(after[a.id].right - a.right)).toBe(40);
		expect(Math.round(after[b.id].left - b.left)).toBe(40);
		expect(Math.round(after[b.id].right)).toBe(Math.round(b.right));
	});

	test('R and the tab\'s [R] fetch the images afresh', async ({ page }) => {
		await enterBoard(page, 'Sateliti');
		const img = block(page, 'neverin-satelit-hr').locator('.slide.active img');
		await expect(img).not.toHaveAttribute('src', /_r=/);
		await page.keyboard.press('r');
		await expect(img).toHaveAttribute('src', /[?&]_r=\d+$/);
	});

	test('R fetches each kind of map as its type says: frames and videos again, interactive maps not', async ({ page }) => {
		await enterBoard(page, 'Radari');
		const requested = [];
		page.on('request', request => requested.push(request.url()));
		await page.keyboard.press('r');
		await expect.poll(() => requested.some(url => url.includes('cdn.fmi.fi'))).toBe(true); // eumetnet, a plain frame
		await expect.poll(() => requested.some(url => url.includes('sat-eu.mp4') || url.includes('radar.gif'))).toBe(true);
		expect(requested.some(url => url.includes('embed.windy.com'))).toBe(false); // live of its own accord
	});

	test('D copies the widget on top', async ({ page }) => {
		await enterBoard(page, 'Sateliti');
		// a press raises it; the bottom row, clear of the tab hanging over the top one
		const b = await box(block(page, 'idokep-satelit-eu').locator(':scope > .radartitle'));
		await page.mouse.click(b.x + 8, b.cy);
		await page.keyboard.press('d');
		await expect(page.locator('.map-block.duplicate')).toHaveCount(1);
		await expect(block(page, 'idokep-satelit-eu#2')).toHaveClass(/popout/);
	});

	test('leaving the board docks everything', async ({ page }) => {
		await enterBoard(page, 'Sateliti');
		await page.locator('.ms-tab').click({ position: { x: 20, y: 8 } });
		await expect(page.locator('#mapSettings')).toBeVisible();
		await page.locator('#mapSettings .ms-mode button', { hasText: 'Nadzorna ploča' }).click();
		await page.locator('#mapSettings .ms-apply').click();
		await expect(page.locator('body')).not.toHaveClass(/dashboard/);
		await expect(page.locator('.map-block.popout')).toHaveCount(0);
		expect((await storedJson(page, 'mapPrefs')).layout).toBeUndefined();
	});

	test('the tab is dragged along the top edge and remembered', async ({ page }) => {
		await enterBoard(page, 'Sateliti');
		const tab = page.locator('.ms-tab');
		const before = await box(tab);
		await drag(page, { x: before.x + 20, y: before.cy }, { x: before.x - 280, y: before.cy });
		const after = await box(tab);
		expect(Math.round(before.x - after.x)).toBe(300);
		expect(await storedJson(page, 'msTab')).toMatchObject({ width: Math.round(after.width) });
		await expect(page.locator('#mapSettings')).toBeHidden(); // a drag is no click
	});
});

test.describe('auto-refresh', () => {
	test('re-fetches the images on the interval and counts down', async ({ page, paths }) => {
		await page.clock.install();
		await page.goto(paths.customize);
		await openDialog(page);
		await page.locator('#mapSettings .ms-refresh label', { hasText: 'Osvježavaj' }).click();
		await expect(page.locator('body')).toHaveClass(/refresh-on/);
		expect(await storedJson(page, 'mapRefresh')).toEqual({ on: true, minutes: 5 });
		await expect(page.locator('#mapSettings .ms-refresh-left')).toHaveText(/^još [45]:\d\d$/);
		const before = await page.locator('#mapSettings .ms-refresh-left').textContent();
		await page.clock.runFor(3000); // the dialog's own countdown moves with the clock
		await expect(page.locator('#mapSettings .ms-refresh-left')).not.toHaveText(before);
		await page.keyboard.press('Escape');
		const img = page.locator('.map-block[data-inst="neverin-radar-hr"] .slide.active img');
		await expect(img).not.toHaveAttribute('src', /_r=/);
		await page.clock.runFor(5 * 60 * 1000 + 2000);
		await expect(img).toHaveAttribute('src', /_r=\d+$/);
		await expect(page.locator('.ms-tab .ms-tab-count')).toHaveText(/^[45]:\d\d$/);
	});
});
