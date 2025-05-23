
## meteo

A compilation of Croatia and Europe weather radar and satellite images.

Available at <https://jurakovic.github.io/meteo/>.

* * *

### Overview

Two main folders:

[`src`](./src)
- contains source files for site build
- no particular framework is used, only vanilla HTML, CSS, and JavaScript
	- all *build magic* is done in [`build.sh`](./src/build.sh) and [`build.ps1`](./src/build.ps1) scripts

[`docs`](./docs)
- contains build output
- source for GitHub Pages publish

### Commands

#### Run from src

```bash
docker run -d -p 8080:80 --name meteo -v "$(pwd)/src:/usr/share/nginx/html" nginx
```

Open <http://localhost:8080>

#### Minify JS

```bash
docker run -it --rm --entrypoint sh -v "$(pwd):/meteo" node:22-alpine

# inside container
cd meteo
npm install terser -g
terser src/_assets/js/main.js --compress --mangle -o src/_assets/js/main.min.js --format max_line_len=140
```

#### Build

```bash
cd src
./build.sh
```
