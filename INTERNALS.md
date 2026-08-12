
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

#### Run from docs (built site)

The build rewrites paths for GitHub Pages (`/meteo/...`), so mount `docs/` under the same subpath:

```bash
docker run -d -p 8081:80 --name meteo-docs -v "$(pwd)/docs:/usr/share/nginx/html/meteo" nginx
```

Open <http://localhost:8081/meteo/>

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

`build.ps1` produces `docs/` from `src/` by processing every `.html` file (except `_components/`):

1. inlines the minified assets (`styles.min.css`, `main.min.js`, `maps.min.js`) in place of their `<link>`/`<script>` tags
2. injects `_components/*.c.html` (seo, gtag, links) at their placeholders
3. rewrites dev paths to GitHub Pages paths (`href="/customize/index.html` → `/meteo/customize/`, `href="/"` → `/meteo/"`, image paths, the extras stub's `url=`)
4. strips HTML comments, trims trailing whitespace, collapses blank lines

### Maps catalog

The landing page ([`src/index.html`](./src/index.html)) is plain static HTML and does not load `maps.js`. The customize page ([`src/customize/index.html`](./src/customize/index.html)) renders its maps client-side by [`maps.js`](./src/_assets/js/maps.js) from a single catalog (`MAP_CATALOG`) into `<tbody data-maps>`. `maps.js` is loaded before `main.js` (both `defer`) and renders immediately when the DOM is already parsed (dev, deferred external script) or on `DOMContentLoaded` otherwise (the docs build inlines it into `<head>`, where `defer` does not apply) — either way before the wiring in `main.js` runs, so it sees the finished DOM. `src/extras/index.html` is only a redirect stub to the customize page (kept for old bookmarks).

Note: the landing page's maps are duplicated in the catalog — a URL or layout change there must be applied in both places.

#### Map descriptors

Every map is one object with `id`, `category` (radar/satelit/munje/… — shown as a glyph in the picker, see `CATEGORY_GLYPHS`), `name` (shown both in the title bar and in the settings picker), `titleHref`, optional `maxWidth`/`aspect`, `links`, and a `type`:

| type | notes |
|---|---|
| `slideshow` | `slides` is an array of image URLs, or of `{ title, img, aspect }` objects when each slide has its own title bar (`title.text` may be omitted to inherit the map's `name` — useful when only the `href` differs per slide); `startSlide` (1-based) is eager, the rest lazy-load unless `eagerSlides`; `dynamicWidth` resizes the container to the active slide, and only works on titled slideshows — `updateSlideshowWidth()` reads the active slide's `.placeholder` wrapper, which untitled slides do not have |
| `image` | single `img`, optional `alt` |
| `video` | mp4 `src`; `videoClass` picks the aspect wrapper (`vid1`/`vid2`) |
| `iframe` | interactive map with HR/EU zoom switch, overlay gate and fullscreen; `frameId` plus `srcHr`/`srcEu` and the four `zoom*` marker strings consumed by `setIframeSrc()` in `main.js` |
| `iframe-basic` | plain lazy iframe (`src`), no overlay/zoom |

The repeated per-map link rows come from shared groups (`RADAR_HR_LINKS`, `SAT_EU_LINKS`, …); `except(group, 'Name')` implements the "same set minus the map itself" pattern.

#### Presets and preferences

`DEFAULT_MAPS` holds the default order (mirroring the landing page); `MAP_PRESETS` lists the built-in presets, each carrying its own `maps` id list so resolving one is a plain lookup (`zadano` is the default set — displayed as *Osnovno*, but the id stays `zadano` because it is written into saved preferences and shared links; `vise` is the former extras set, `sve` the whole catalog, `nista` none). The "Karte" button opens a settings panel with two sections: the selected maps on top (this *is* the render order — drag the `≡` handle to reorder) and the available maps below (a finding surface only, sortable by name or category without affecting the render order; checking a map appends it to the selected block). Changing the selection or order auto-selects *Prilagođeno*. *Primijeni* saves to localStorage as `mapPrefs` (`{"preset":"radari"}` or `{"preset":"custom","maps":[…]}`), re-renders, and calls `initDynamicContent()` in `main.js` to wire the fresh DOM (lazy images, swipe, iframe src, overlays, link shadows, progress bar).

#### Saved presets

Below the picker, *Moji predlošci* lets the current selection be saved under a name (`mapUserPresets`), then renamed, shared or deleted. Saved presets take the same `{ id, name, maps }` shape as the built-ins and are appended to them by `allPresets()`, so the preset bar, `presetMapIds()` and the stored preferences treat both alike. Their ids are prefixed `u:` to keep them out of the built-in namespace, which leaves the name free to change — renaming never breaks a saved preference. Saving under an existing name overwrites that preset, so the name is the handle: it is trimmed, collapsed and capped at `PRESET_NAME_MAX`. In the preset bar, saved presets carry a corner triangle (`.ms-chip.ms-user`, a `::after` so it costs no layout in chips that stretch and centre their names) — the same split the two management headings draw.

Amending a saved view has a direct path too: pick its chip, edit the list, and its row grows an *Ažuriraj* link writing what is on screen over it. Both paths end in `storeUserPreset()` keyed by name, so preset contents have one write path, and the id survives — preferences and links naming that preset follow the change. The link hangs off `editingPresetId`, the preset the list was *loaded from*, not the bar selection, which editing flips to *Prilagođeno* (`markCustom()`, which re-renders the management list so the link tracks the edits). It shows only while the on-screen list differs from what is stored, and only on that row: an unrelated list must never overwrite a preset. Its column is added to and dropped from every row together (`showUpdate` / `.ms-editing`), keeping the action slots aligned and off a phone row when the action is not on offer. Like the rest of the panel it saves the preset only — the page still needs *Primijeni*.

Built-ins cannot be deleted (they are code) but can be hidden from the preset bar (`mapHiddenPresets`). Hiding is a **display choice only** — `allPresets()` keeps returning them, so a saved preference, the `zadano` fallback and a shared link naming a preset the recipient hides all still resolve; only `visiblePresets()` filters. `zadano` is exempt (`PERMANENT_PRESET_ID`) so the bar can never come down to *Prilagođeno* alone.

Deleting is the one panel action that writes to storage without *Primijeni*, so `deleteUserPreset()` also rewrites a `mapPrefs` naming the deleted preset into a `custom` snapshot of its maps — otherwise it would fail `isValidPrefs()` on the next load and silently fall back to *Osnovno*.

#### Share links

*Podijeli* copies a link with the current panel state URL-safe-base64 encoded in `?v=`. On load the parameter overrides saved preferences **for the session only** — it never writes to the recipient's localStorage. The parameter stays in the address bar (refresh-safe, re-copyable) and is removed via `history.replaceState` when the user applies their own settings. Clipboard API needs a secure context (https/localhost); elsewhere a prompt with the link is shown.

A built-in preset travels as its id, which every visitor resolves. A saved preset's id means nothing to a recipient, so it travels as its contents plus its name (`preset: 'custom'` + `maps` + `name`); the panel then offers to save it under that name, de-duplicated against the recipient's own presets so nothing of theirs is overwritten.

Arriving without an id, such a link would always open on *Prilagođeno* — including your own, where the list is a preset you already have. `activePresetId()` matches it back with `presetIdForMapIds()`: contents and order only (the name is a label the recipient may have used for something else, and a renamed preset is still the same view), saved presets searched before built-ins so a saved copy of a built-in list selects the copy. Matching also drops the offer to save it, which would only add a suffixed duplicate. Only the session-only shared view is matched this way — a `custom` in stored `mapPrefs` is a list the user chose not to save, and binding it to a preset id would hand later edits of that preset to a view that merely matches today.

Note when extending the payload: `btoa()` rejects code points above U+00FF, and the name is user-typed — every Croatian diacritic (č ć š ž đ) is above it. `encodeMapView()` escapes non-ASCII to `\uXXXX` before encoding, which keeps the input ASCII and needs no counterpart in `decodeMapView()`, since `JSON.parse` reads those escapes back on its own.

#### Misc

- `?debug=1` on any page enables console logging via `dlog()` in `main.js`
- localStorage keys: `mapPrefs` (customize page view), `mapUserPresets` (saved presets), `mapHiddenPresets` (built-ins hidden from the preset bar), `showLinksBottom` (links-under-maps toggle). Everything read back from storage or from `?v=` passes a guard (`isValidPrefs`, `isValidPreset`, the filter in `loadHiddenPresets`) — an unknown preset id is rejected rather than kept, and every write is wrapped so disabled or full storage still leaves the view working for the session

#### Touch notes

Hard-won details worth keeping in mind when touching the drag/scroll code:

- the drag handle must not be `display: inline` — `touch-action` is ignored on non-replaced inline elements, so touches would scroll the page instead of dragging
- pointer capture cannot be used for the drag: touch pointers implicitly capture the handle, and any capture breaks once the row is moved in the DOM (`insertBefore`). The implicit capture is released on `pointerdown` and move/up listeners live on `document` instead
- `scrollIntoView` scrolls *all* ancestors, so it cannot be used to reveal something inside the panel — it drags the page back up to the panel too. The preset bar used to scroll horizontally and needed a hand-rolled reveal for this reason; it now wraps its options as chips instead, growing in the axis the page already scrolls, and the reveal is gone
