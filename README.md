
# meteo

A compilation of Croatia and Europe weather radar and satellite images.

Available at <https://jurakovic.github.io/meteo/>.

* * *

### Overview

Two main folders:

[`src`](./src)
- contains source files for site build
- no particular framework is used, only vanilla HTML, CSS, and JavaScript
	- all build *magic* is done in [`build.sh`](./src/build.sh) and [`build.ps1`](./src/build.ps1) scripts

[`docs`](./docs)
- contains build output
- source for GitHub Pages publish

### Commands

#### Run from src

```bash
docker run -d -p 8080:80 --name meteo -v "$(pwd)/src:/usr/share/nginx/html" nginx
```

Open <http://localhost:8080>

#### Minify JS and CSS

> [`terser`](https://www.npmjs.com/package/terser), [`clean-css-cli`](https://www.npmjs.com/package/clean-css-cli)

```bash
docker run -it --rm --entrypoint sh -v "$(pwd):/meteo" node:22-alpine

# inside container
npm install terser@5.42.0 -g
npm install clean-css-cli -g
cd meteo/src/_assets
terser js/main.js --compress --mangle -o js/main.min.js --format max_line_len=140
cleancss --format 'wrapAt:140' -o css/styles.min.css css/styles.css
```

#### Build

```bash
cd src
./build.sh
```
