// ESLint over the site's scripts, the build and the tests
import js from '@eslint/js';
import globals from 'globals';

export default [
	{ ignores: ['docs/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'] },
	js.configs.recommended,
	{
		files: ['src/_assets/js/**/*.js'],
		languageOptions: { sourceType: 'module', globals: globals.browser }
	},
	{
		// dev only (the build inlines what it fetches)
		files: ['src/_assets/js/include.js'],
		languageOptions: { sourceType: 'script' }
	},
	{
		files: ['scripts/**', 'tests/**', '*.config.js'],
		// the tests' page.evaluate callbacks run in the browser
		languageOptions: { sourceType: 'module', globals: { ...globals.node, ...globals.browser } }
	}
];
