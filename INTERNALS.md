
# Internals

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
npm install terser -g
npm install clean-css-cli -g
cd meteo/src/_assets
terser js/main.js --compress --mangle -o js/main.min.js --format max_line_len=140
terser js/maps.js --compress --mangle -o js/maps.min.js --format max_line_len=140
cleancss --format 'wrapAt:140' -o css/styles.min.css css/styles.css
```

#### Build

```bash
cd src
./build.sh
```

### Maps catalog

All maps on both pages are rendered client-side by [`maps.js`](./src/_assets/js/maps.js) from a single catalog (`MAP_CATALOG`) into `<tbody data-maps data-page="index|extras">`. `maps.js` is loaded before `main.js` (both `defer`) and renders at script evaluation time, so the wiring in `main.js` (`DOMContentLoaded`) sees the finished DOM.

#### Map descriptors

Every map is one object with `id`, `name` (shown both in the title bar and in the settings picker), `titleHref`, optional `maxWidth`/`aspect`, `links`, and a `type`:

| type | notes |
|---|---|
| `slideshow` | `slides` is an array of image URLs, or of `{ title, img, aspect }` objects when each slide has its own title bar; `startSlide` (1-based) is eager, the rest lazy-load unless `eagerSlides`; `dynamicWidth` resizes the container to the active slide |
| `image` | single `img`, optional `alt` |
| `video` | mp4 `src`; `videoClass` picks the aspect wrapper (`vid1`/`vid2`) |
| `iframe` | interactive map with HR/EU zoom switch, overlay gate and fullscreen; `frameId` plus `srcHr`/`srcEu` and the four `zoom*` marker strings consumed by `setIframeSrc()` in `main.js` |
| `iframe-basic` | plain lazy iframe (`src`), no overlay/zoom |

The repeated per-map link rows come from shared groups (`RADAR_HR_LINKS`, `SAT_EU_LINKS`, …); `except(group, 'Name')` implements the "same set minus the map itself" pattern.

#### Presets and preferences

`PAGE_DEFAULT_MAPS` holds each page's default order; `MAP_PRESETS` lists the named presets (`zadano` resolves to the page default, `sve` to the whole catalog). The "Karte" button opens a settings panel to pick a preset or a custom checked/ordered list (drag the `≡` handle). Changing the list auto-selects *Prilagođeno*. *Primijeni* saves to localStorage as `mapPrefs-{page}` (`{"preset":"radari"}` or `{"preset":"custom","maps":[…]}`), re-renders, and calls `initDynamicContent()` in `main.js` to wire the fresh DOM (lazy images, swipe, iframe src, overlays, link shadows).

#### Share links

*Podijeli* copies a link with the current panel state URL-safe-base64 encoded in `?v=`. On load the parameter overrides saved preferences **for the session only** — it never writes to the recipient's localStorage. The parameter stays in the address bar (refresh-safe, re-copyable) and is removed via `history.replaceState` when the user applies their own settings. Clipboard API needs a secure context (https/localhost); elsewhere a prompt with the link is shown.

#### Touch notes

Hard-won details worth keeping in mind when touching the drag/scroll code:

- the drag handle must not be `display: inline` — `touch-action` is ignored on non-replaced inline elements, so touches would scroll the page instead of dragging
- pointer capture cannot be used for the drag: touch pointers implicitly capture the handle, and any capture breaks once the row is moved in the DOM (`insertBefore`). The implicit capture is released on `pointerdown` and move/up listeners live on `document` instead
- `scrollIntoView` scrolls *all* ancestors — for revealing a preset radio in the horizontally scrollable preset row, only the row itself may be scrolled (`revealPresetOption()`), otherwise the page jumps
