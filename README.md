
A compilation of Croatia and Europe weather radar and satellite images.

Available at <https://jurakovic.github.io/meteo/>.

* * *

### Overview

Two main folders:

[src](./src)
- contains source files for site build
- no particular framework is used, just some plain html, js and css
	- all *build* magic is done in [build.ps1](./src/build.ps1) script

[docs](./docs)
- contains build output
- source for GitHub Pages publish

### Commands

#### Run from src

```bash
cd src
docker run -d -p 8080:80 --name meteo -v "$(pwd):/usr/share/nginx/html" nginx
```

Open <http://localhost:8080>

#### Build

```bash
cd src
./build.sh
```
