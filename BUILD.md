
#### Run from src

```bash
cd meteo/src

docker run -d -p 8080:80 --name meteo -v "$(pwd):/usr/share/nginx/html" nginx
```

Open <http://localhost:8080>

#### Build

Option 1:

```
cd meteo

docker run -it --rm -v "$(pwd):/app" node:22-slim bash

cd /app/src
npm install
npm run build
```

Option 2:

> if node_modules already exist

```
cd meteo

docker run -it --rm -v "$(pwd):/app" node:22-slim /usr/local/bin/node /app/src/build.js
```
