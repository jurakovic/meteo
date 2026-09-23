// ESLint over the site's scripts, the build and the tests
import js from '@eslint/js';
import globals from 'globals';

export default [
	{ ignores: ['docs/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'] },
	js.configs.recommended,
	{
		files: ['src/**/*.js'],
		languageOptions: { sourceType: 'script', globals: globals.browser },
		rules: {
			// the site's scripts still share one global scope, each using what the
			// others declare — both come back on once they are modules (S4)
			'no-undef': 'off',
			'no-unused-vars': 'off'
		}
	},
	{
		files: ['scripts/**', 'tests/**', '*.config.js'],
		// the tests' page.evaluate callbacks run in the browser
		languageOptions: { sourceType: 'module', globals: { ...globals.node, ...globals.browser } }
	}
];
