// Browser tests over the dev tree (src/) and the built site (docs/). The maps'
// own sources are never reached: tests/e2e/fixtures.js answers every request
// that leaves the local server, so the suite runs offline and the same way
// every time
import { defineConfig } from '@playwright/test';

// clear of the nginx ports in INTERNALS.md (8080 serves src/, 8081 docs/)
const port = 8082;
const origin = `http://meteo.test:${port}`;

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	retries: 0,
	reporter: [['list']],
	use: {
		viewport: { width: 1400, height: 900 },
		launchOptions: {
			// a name of its own for the local server, resolved here without a
			// hosts entry; not localhost, which would make the page a secure context
			args: [`--host-resolver-rules=MAP meteo.test 127.0.0.1`]
		}
	},
	projects: [
		{ name: 'dev', use: { baseURL: origin, paths: { landing: '/', customize: '/customize/index.html' } } },
		{ name: 'built', use: { baseURL: origin, paths: { landing: '/meteo/', customize: '/meteo/customize/' } } }
	],
	webServer: {
		command: `node tests/serve.mjs`,
		env: { PORT: String(port) },
		url: `http://127.0.0.1:${port}/`,
		reuseExistingServer: true,
		ignoreHTTPSErrors: true
	}
});
