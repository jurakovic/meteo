
# Meteo radari

A compilation of Croatia and Europe weather radar and satellite images

<https://jurakovic.github.io/meteo/>

* * *

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
