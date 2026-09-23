// Pop-out widgets over the customize page: lifting and docking, dragging,
// resizing, the snap columns, copies, groups, fullscreen and the keys
import { test, expect, storedJson, drag, box } from './fixtures.js';

const block = (page, inst) => page.locator(`.map-block[data-inst="${inst}"]`);
const bar = (page, inst) => block(page, inst).locator(':scope > .radartitle');

async function popout(page, inst) {
	await bar(page, inst).locator('.po-btn').click();
	await expect(block(page, inst)).toHaveClass(/popout/);
}

// a point on the title bar clear of its link and its buttons
async function grip(page, inst) {
	const b = await box(bar(page, inst));
	return { x: b.x + 8, y: b.cy };
}

async function moveWidget(page, inst, dx, dy) {
	const from = await grip(page, inst);
	await drag(page, from, { x: from.x + dx, y: from.y + dy });
}

async function floating(page) {
	return ((await storedJson(page, 'mapPrefs')) || {}).layout?.floating || [];
}

test.describe('pop-out widgets', () => {
	test.beforeEach(async ({ page, paths }) => {
		await page.goto(paths.customize);
		await expect(block(page, 'neverin-radar-hr')).toBeVisible();
	});

	test('a map pops out into a widget, leaves a gap, and docks back', async ({ page }) => {
		await popout(page, 'neverin-radar-hr');
		expect(Math.round((await box(block(page, 'neverin-radar-hr'))).width)).toBe(420);
		await expect(page.locator('.map-gap')).toHaveCount(1);
		await expect(bar(page, 'neverin-radar-hr').locator('.po-btn')).toHaveText('[=]');
		expect((await floating(page)).map(f => f.id)).toEqual(['neverin-radar-hr']);
		await bar(page, 'neverin-radar-hr').locator('.po-btn').click();
		await expect(block(page, 'neverin-radar-hr')).not.toHaveClass(/popout/);
		await expect(page.locator('.map-gap')).toHaveCount(0);
		expect((await storedJson(page, 'mapPrefs')).layout).toBeUndefined();
	});

	test('the gap\'s Vrati docks the widget', async ({ page }) => {
		await popout(page, 'neverin-radar-hr');
		await moveWidget(page, 'neverin-radar-hr', 500, 200);
		await page.locator('.map-gap a', { hasText: 'Vrati' }).click();
		await expect(block(page, 'neverin-radar-hr')).not.toHaveClass(/popout/);
	});

	test('a dragged widget moves with the pointer, and its place survives a reload', async ({ page }) => {
		await popout(page, 'neverin-radar-hr');
		const before = await box(block(page, 'neverin-radar-hr'));
		await moveWidget(page, 'neverin-radar-hr', 300, 150);
		const after = await box(block(page, 'neverin-radar-hr'));
		expect(Math.round(after.x - before.x)).toBe(300);
		expect(Math.round(after.y - before.y)).toBe(150);
		const [entry] = await floating(page);
		const vw = await page.evaluate(() => document.documentElement.clientWidth);
		expect(entry.left).toBeCloseTo(after.x / vw, 3);
		await page.reload();
		await expect(block(page, 'neverin-radar-hr')).toHaveClass(/popout/);
		const restored = await box(block(page, 'neverin-radar-hr'));
		expect(Math.abs(restored.x - after.x)).toBeLessThan(1);
		expect(Math.abs(restored.y - after.y)).toBeLessThan(1);
	});

	test('a plain pull frees the aspect; Shift keeps it', async ({ page }) => {
		await popout(page, 'neverin-radar-hr');
		await moveWidget(page, 'neverin-radar-hr', 200, 100);
		const w = block(page, 'neverin-radar-hr');
		const start = await box(w);
		const east = await box(w.locator('.po-h-e'));
		await page.keyboard.down('Shift');
		await drag(page, { x: east.cx, y: east.cy }, { x: east.cx + 100, y: east.cy });
		await page.keyboard.up('Shift');
		const locked = await box(w);
		await expect(w).not.toHaveClass(/free/);
		expect(Math.round(locked.width - start.width)).toBe(100);
		expect(locked.height).toBeGreaterThan(start.height + 50); // the height follows the width
		const east2 = await box(w.locator('.po-h-e'));
		await drag(page, { x: east2.cx, y: east2.cy }, { x: east2.cx - 60, y: east2.cy });
		await expect(w).toHaveClass(/free/);
		await expect(w).toHaveClass(/letterbox/);
		const freed = await box(w);
		expect(Math.round(freed.height)).toBe(Math.round(locked.height)); // only the width moved
		// a double click on the bar locks it again, coming in to the image
		const g = await grip(page, 'neverin-radar-hr');
		await page.mouse.dblclick(g.x, g.y);
		await expect(w).not.toHaveClass(/free/);
		expect((await floating(page))[0].height).toBeUndefined();
	});

	test('dragged to the left edge a widget snaps into a column, and out again sideways', async ({ page }) => {
		await popout(page, 'neverin-radar-hr');
		const w = block(page, 'neverin-radar-hr');
		const b = await box(w);
		await moveWidget(page, 'neverin-radar-hr', -b.x - 30, 0);
		await expect(w).toHaveClass(/snapped-left/);
		expect(Math.round((await box(w)).x)).toBe(0);
		const layout = (await storedJson(page, 'mapPrefs')).layout;
		expect(layout.left.panes.map(p => p.id)).toEqual(['neverin-radar-hr']);
		expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--snap-l'))).not.toBe('0px');
		await moveWidget(page, 'neverin-radar-hr', 300, 0);
		await expect(w).not.toHaveClass(/snapped/);
		expect((await storedJson(page, 'mapPrefs')).layout.left).toBeUndefined();
	});

	test('a column\'s edge resizes it, and a double click hides the page behind it', async ({ page }) => {
		await popout(page, 'neverin-radar-hr');
		const b = await box(block(page, 'neverin-radar-hr'));
		await moveWidget(page, 'neverin-radar-hr', -b.x - 30, 0);
		const edge = page.locator('.snap-edge[data-side="left"]');
		const e = await box(edge);
		const before = await box(block(page, 'neverin-radar-hr'));
		await drag(page, { x: e.cx, y: e.cy }, { x: e.cx + 80, y: e.cy });
		expect(Math.round((await box(block(page, 'neverin-radar-hr'))).width - before.width)).toBe(80);
		const e2 = await box(edge);
		await page.mouse.dblclick(e2.cx, e2.cy);
		await expect(page.locator('body')).toHaveClass(/snap-full/);
		await expect(page.locator('.ms-tab')).toBeVisible();
		// the column reaches the far side now, its edge half off the screen
		const e3 = await box(edge);
		await page.mouse.dblclick(e3.x + 2, e3.cy);
		await expect(page.locator('body')).not.toHaveClass(/snap-full/);
	});

	test('[D] makes a copy that is part of the arrangement and closes on its own', async ({ page }) => {
		await popout(page, 'neverin-radar-hr');
		await bar(page, 'neverin-radar-hr').locator('.dup-btn').click();
		const copy = block(page, 'neverin-radar-hr#2');
		await expect(copy).toHaveClass(/duplicate/);
		await expect(copy).toHaveClass(/popout/);
		await expect(copy.locator('.slideshow')).toHaveAttribute('data-slideshow-id', 'neverin-radar-hrCopy2');
		expect((await floating(page)).map(f => f.id).sort()).toEqual(['neverin-radar-hr', 'neverin-radar-hr#2']);
		await page.reload();
		await expect(copy).toHaveClass(/popout/);
		// its arrows drive itself only
		await copy.locator('.next').click();
		await expect(copy.locator('.slideshow')).toHaveAttribute('data-current-slide', '3');
		await expect(block(page, 'neverin-radar-hr').locator('.slideshow')).toHaveAttribute('data-current-slide', '2');
		await copy.locator(':scope > .radartitle .po-btn').click();
		await expect(copy).toHaveCount(0);
		await expect(block(page, 'neverin-radar-hr')).toHaveClass(/popout/);
	});

	test('widgets pulled edge to edge by the magnets can be grouped and move together', async ({ page }) => {
		await popout(page, 'neverin-radar-hr');
		await moveWidget(page, 'neverin-radar-hr', 150, 150);
		await popout(page, 'neverin-satelit-hr');
		const a = await box(block(page, 'neverin-radar-hr'));
		const b = await box(block(page, 'neverin-satelit-hr'));
		// the second widget's left edge dropped a few pixels off the first's right
		await moveWidget(page, 'neverin-satelit-hr', a.right + 6 - b.x, a.y + 10 - b.y);
		const placed = await box(block(page, 'neverin-satelit-hr'));
		expect(Math.abs(placed.x - a.right)).toBeLessThan(0.01);
		expect(Math.abs(placed.y - a.y)).toBeLessThan(0.01); // the tops line up too
		const grp = bar(page, 'neverin-radar-hr').locator('.grp-btn');
		await expect(grp).toHaveText('[+]');
		await grp.click();
		await expect(block(page, 'neverin-radar-hr')).toHaveClass(/grouped/);
		await expect(block(page, 'neverin-satelit-hr')).toHaveClass(/grouped/);
		await moveWidget(page, 'neverin-radar-hr', 0, 100);
		expect(Math.round((await box(block(page, 'neverin-satelit-hr'))).y - placed.y)).toBe(100);
		const entries = await floating(page);
		expect(entries.every(e => e.group === 1)).toBe(true);
		await grp.click(); // [-]
		await expect(block(page, 'neverin-satelit-hr')).not.toHaveClass(/grouped/);
	});

	test('the arrows nudge the widget on top a grid cell, a pixel with Shift', async ({ page }) => {
		await popout(page, 'neverin-radar-hr');
		await moveWidget(page, 'neverin-radar-hr', 200, 100);
		const before = await box(block(page, 'neverin-radar-hr'));
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('Shift+ArrowDown');
		const after = await box(block(page, 'neverin-radar-hr'));
		expect(Math.round(after.x - before.x)).toBe(16);
		expect(Math.round(after.y - before.y)).toBe(1);
		await expect.poll(async () => (await floating(page))[0].left).toBeCloseTo(after.x / await page.evaluate(() => document.documentElement.clientWidth), 3);
	});

	test('an interactive map\'s fullscreen inside a widget: the bar\'s double click, Escape', async ({ page }) => {
		await popout(page, 'windy');
		const w = block(page, 'windy');
		const b = await box(w.locator(':scope > .radartitle'));
		await page.mouse.dblclick(b.right - 120, b.cy); // on the bar between the title and the buttons
		await expect(w.locator('.if1')).toHaveClass(/fullscreen/);
		await expect(w).toHaveClass(/fs-host/);
		await expect.poll(async () => (await floating(page))[0].fullscreen).toBe(true);
		await page.keyboard.press('Escape');
		await expect(w.locator('.if1')).not.toHaveClass(/fullscreen/);
		await expect(w).not.toHaveClass(/fs-host/);
	});

	test('a middle click on the bar docks the widget', async ({ page }) => {
		await popout(page, 'neverin-radar-hr');
		const g = await grip(page, 'neverin-radar-hr');
		await page.mouse.click(g.x, g.y, { button: 'middle' });
		await expect(block(page, 'neverin-radar-hr')).not.toHaveClass(/popout/);
	});

	test('the dialog\'s Vrati sve docks every widget', async ({ page }) => {
		await popout(page, 'neverin-radar-hr');
		await popout(page, 'windy');
		await page.keyboard.press('k');
		await expect(page.locator('#mapSettings .ms-layout')).toContainText('u prozoru 2');
		await page.locator('#mapSettings .ms-layout a', { hasText: 'Vrati sve' }).click();
		await expect(page.locator('.map-block.popout')).toHaveCount(0);
		await expect(page.locator('#mapSettings .ms-layout')).toBeHidden();
	});

	test('a narrow window docks everything and keeps the arrangement for a wide one', async ({ page }) => {
		// B1 (REFACTORING.md): the arrangement kept for the wide window is read
		// after the viewport has already narrowed, so the widget comes back
		// displaced; fixed in S2
		test.fail();
		await popout(page, 'neverin-radar-hr');
		await moveWidget(page, 'neverin-radar-hr', 200, 100);
		const placed = await box(block(page, 'neverin-radar-hr'));
		await page.setViewportSize({ width: 700, height: 900 });
		await expect(page.locator('.map-block.popout')).toHaveCount(0);
		expect(await floating(page)).toHaveLength(1);
		await page.setViewportSize({ width: 1400, height: 900 });
		await expect(block(page, 'neverin-radar-hr')).toHaveClass(/popout/);
		expect(Math.abs((await box(block(page, 'neverin-radar-hr'))).x - placed.x)).toBeLessThan(1);
	});
});
