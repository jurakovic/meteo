// Browser tests over the dev tree (src/) and the built site (docs/). The maps'
// own sources are never reached: tests/e2e/fixtures.js answers every request
// that leaves the local server, so the suite runs offline and the same way
// every time
import { defineConfig } from '@playwright/test';

const port = 8080;
const origin = `http://localhostmeteo:${port}`;

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	retries: 0,
	reporter: [['list']],
	use: {
		viewport: { width: 1400, height: 900 },
		launchOptions: {
			// the worker allows this origin; it resolves here without a hosts entry
			args: [`--host-resolver-rules=MAP localhostmeteo 127.0.0.1`]
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
