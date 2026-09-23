// Static server for the browser tests: /meteo/* is the built site (docs/,
// as GitHub Pages serves it) and everything else the dev tree (src/)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT) || 8080;
const types = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.png': 'image/png',
	'.json': 'application/json'
};

async function resolveFile(urlPath) {
	const docs = urlPath === '/meteo' || urlPath.startsWith('/meteo/');
	const base = join(root, docs ? 'docs' : 'src');
	const rel = normalize(decodeURIComponent(docs ? urlPath.slice('/meteo'.length) : urlPath));
	let file = join(base, rel);
	if (!file.startsWith(base)) return null;
	try {
		if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
		await stat(file);
		return file;
	} catch {
		return null;
	}
}

createServer(async (req, res) => {
	const file = await resolveFile(new URL(req.url, 'http://x').pathname);
	if (!file) {
		res.writeHead(404).end('not found');
		return;
	}
	res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
	res.end(await readFile(file));
}).listen(port, () => console.log(`serving on http://localhostmeteo:${port}`));
