// The small pages: the meteogram frame the worker screenshots, and the old
// extras address, which redirects to the customize page
import { test, expect } from './fixtures.js';

test('the meteogram page frames the city asked for, with meteoblue\'s credit', async ({ page, paths }) => {
	await page.goto(`${paths.landing}meteogram/?city=st`);
	await expect(page.locator('iframe')).toHaveAttribute('src', /split_croatia/);
	await expect(page.locator('a', { hasText: 'meteoblue' })).toHaveAttribute('href', /meteoblue\.com/);
	await page.goto(`${paths.landing}meteogram/?city=nowhere`);
	await expect(page.locator('iframe')).toHaveCount(0);
});

test('the extras address redirects to the customize page', async ({ page, paths }) => {
	await page.goto(`${paths.landing}extras/`);
	await expect(page).toHaveURL(new RegExp(`${paths.customize.replace(/[.?]/g, '\\$&')}$`));
	await expect(page.locator('.map-block').first()).toBeVisible();
});
