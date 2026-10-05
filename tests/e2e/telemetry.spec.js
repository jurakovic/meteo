// Telemetry: what is counted, read off the console with ?debug=1, which
// counts off the live site and sends nothing (INTERNALS.md, Telemetry)
import { test, expect } from './fixtures.js';

// "name value" for every event counted since the page loaded
function counted(page) {
	const events = [];
	page.on('console', message => {
		const text = message.text();
		if (text.startsWith('telemetry: ') && !text.startsWith('telemetry: counting') && !text.startsWith('telemetry: not sent')) {
			events.push(text.slice('telemetry: '.length).trim());
		}
	});
	return events;
}

test('Escape counts a fullscreen exit only when a map was in fullscreen', async ({ page, paths }) => {
	const events = counted(page);
	await page.goto(`${paths.landing}?debug=1`);
	await page.keyboard.press('Escape');
	const fs = page.locator('.map-block[data-map-id="windy"] .fs-btn');
	await fs.scrollIntoViewIfNeeded();
	await fs.click();
	await expect(page.locator('body')).toHaveClass(/fs-lock/);
	await page.keyboard.press('Escape');
	await expect(page.locator('body')).not.toHaveClass(/fs-lock/);
	await page.keyboard.press('Escape');
	expect(events.filter(e => e.startsWith('command fullscreen'))).toEqual(['command fullscreen', 'command fullscreen-exit']);
});

test('Primijeni counts once, by click or Enter, and a mode change as dashboard on or off', async ({ page, paths }) => {
	const events = counted(page);
	await page.goto(`${paths.customize}?debug=1`);
	const apply = () => page.locator('#mapSettings .ms-apply').click();
	const modeButton = () => page.locator('#mapSettings .ms-mode button', { hasText: 'Nadzorna ploča' });

	await page.keyboard.press('k');
	await apply(); // nothing changed: applied, but no mode change
	await page.keyboard.press('k');
	await modeButton().click();
	await apply();
	await expect(page.locator('body')).toHaveClass(/dashboard/);
	await page.keyboard.press('k');
	await modeButton().click();
	await page.keyboard.press('Enter');
	await expect(page.locator('body')).not.toHaveClass(/dashboard/);

	// the mode is counted inside the apply, the command once it has run
	expect(events.filter(e => /^(command settings-apply|dashboard)/.test(e))).toEqual([
		'command settings-apply',
		'dashboard on', 'command settings-apply',
		'dashboard off', 'command settings-apply'
	]);
});

test('a shared link counts as a list, a board or an invalid one', async ({ page, paths }) => {
	const events = counted(page);
	const encode = (view) => page.evaluate(v => btoa(JSON.stringify(v)), view);
	await page.goto(paths.customize);
	const list = await encode({ preset: 'custom', maps: ['windy', 'essl'] });
	const board = await encode({ preset: 'custom', maps: ['windy', 'essl'], layout: { dashboard: true } });
	await page.goto(`${paths.customize}?debug=1&v=${list}`);
	await page.goto(`${paths.customize}?debug=1&v=${board}`);
	await page.goto(`${paths.customize}?debug=1&v=not-base64!`);
	await page.goto(`${paths.customize}?debug=1`);
	expect(events.filter(e => e.startsWith('shared-link'))).toEqual(['shared-link list', 'shared-link board', 'shared-link invalid']);
});
