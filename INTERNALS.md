# Internals

How the site is built, tested and put together, for someone reading the code. What the site does for its visitors is in [`MANUAL.md`](./MANUAL.md).

## Overview

Two main folders:

[`src`](./src)
- the site's source: vanilla HTML, CSS and JavaScript, no framework

[`docs`](./docs)
- the build output, published by GitHub Pages

and the tooling around them: [`scripts/`](./scripts) (the build), [`tests/`](./tests) (the browser suite and the unit tests) and [`package.json`](./package.json).

## Commands

Node 22 or later. Once, after a clone: `npm install`.

| Command | What it does |
|---|---|
| `npm run build` | builds `docs/` from `src/` (`src/build.sh` does the same) |
| `npm run lint` | ESLint over the site's scripts, the build and the tests, imports checked against exports |
| `npm run typecheck` | TypeScript over the site's scripts, reading their JSDoc types (`jsconfig.json`; nothing is emitted) |
| `npm test` | unit tests (`node --test`) |
| `npm run test:e2e` | the browser suite (Playwright; `npx playwright install chromium` once) |
| `npm run check` | all of the above, in that order |

Without Node installed, the same runs in a container:

```bash
docker run -it --rm -v "$(pwd):/meteo" -w /meteo node:22 sh -c "npm install && npm run build"
```

### Run from src

```bash
docker run -d -p 8080:80 --name meteo -v "$(pwd)/src:/usr/share/nginx/html" nginx
```

Open <http://localhost:8080>

### Run from docs (built site)

The build rewrites paths for GitHub Pages (`/meteo/...`), so mount `docs/` under the same subpath:

```bash
docker run -d -p 8081:80 --name meteo-docs -v "$(pwd)/docs:/usr/share/nginx/html/meteo" nginx
```

Open <http://localhost:8081/meteo/>

`node tests/serve.mjs` serves both at once: `src/` at the root and `docs/` under `/meteo/` (port 8080, or `PORT`).

### Build

[`scripts/build.mjs`](./scripts/build.mjs) produces `docs/` from `src/` by processing every `.html` file outside `_components/`:

1. injects the manual ([`scripts/manual.mjs`](./scripts/manual.mjs)) at `<!-- manual -->` and drops the dialog body's dev-only include; the fragment is also written to `_components/manual.c.html` for the dev pages. This runs before the path rewrites, so a path the manual grows later is rewritten with every other
2. minifies the CSS (clean-css), bundles each page's entry module with everything it imports (esbuild), minifies it (terser), and inlines both in place of their `<link>`/`<script type="module">` tags
3. injects `_components/*.c.html` (seo, gtag, links) at their placeholders
4. rewrites dev paths to GitHub Pages paths (`href="/customize/index.html` → `/meteo/customize/`, `href="/"` → `/meteo/"`, image paths, the extras stub's `url=`)
5. strips HTML comments, trims trailing whitespace, collapses blank lines, and writes CRLF

The inlined blocks are indented by splitting on CRLF, as the PowerShell build it replaced did, so a fragment with LF endings (`links.c.html`) is one line to it. That is kept as it was: the Node build was checked to produce the PowerShell build's `docs/` byte for byte.

## Tests

The browser suite ([`tests/e2e`](./tests/e2e)) drives both the dev tree and the built site. Every request that leaves the local server is answered by [`fixtures.js`](./tests/e2e/fixtures.js): map images as an SVG of a map's size, frames as an empty page, the worker's `config.json` as a test chooses. So the suite runs offline and the same way every time, and a script error on a page fails the test. Chromium resolves `localhostmeteo` (the origin the worker allows) to the local server by a launch flag, so no hosts entry is needed.

The unit tests ([`tests/unit`](./tests/unit)) run what needs no browser under Node, with a stub for the little DOM the modules touch on import ([`setup.mjs`](./tests/unit/setup.mjs)): the manual's converter, the catalog and presets, preferences, find and share links, storage, what the settings dialog would apply, and the widgets' arithmetic (tiling, magnets, touching, group relations, the walls around a fullscreen map, the layout's sanitizer).

## Code map

The scripts are ES modules under [`src/_assets/js`](./src/_assets/js). The dev pages load them as they are (`<script type="module">`); the build bundles each page's entry into one inlined script.

| Where | What |
|---|---|
| `landing.js`, `customize.js` | the two pages' entry points. Modules only declare; an entry wires them up in order: what must be in place before the first paint at once (in the build the script runs in `<head>`), the rest once the document is parsed (`onReady`, each step on its own so one failing does not stop the others) |
| `lib/` | helpers that know nothing of maps: `dom` (`el`, `query`/`queryAll`, `onReady`, `isTextField`, `cssNumber`), `geometry` (`clamp`, the viewport), `pointer` (a drag or resize gesture), `media` (the breakpoint), `storage` (every key the site stores; reads and writes that never throw), `events` (every event the page announces), `debug` (`dlog`) |
| `features.js` | switches for parts built but not offered yet |
| `remote-config.js` | which maps the worker's `config.json` switches off |
| `page/` | what both pages have: the slideshows, the interactive maps' gate and fullscreen (`iframe`), the links, the progress bar, the dialog chrome (`dialog`), the manual, and `commands` |
| `maps/` | the maps' data and drawing: the `catalog`, the map `types`, the `presets`, the stored or shared view (`prefs`), share links (`share`), `find`, `render`, and each page's view of them (`landing`, `view`) |
| `settings/` | the settings dialog: `panel` and its sections (`panel-presets`, `panel-rows`, `panel-list`, `panel-manage`, with `panel-view` working out what it would apply), the tab at the top edge (`tab`) and its `[+]` menu (`add-menu`) |
| `widgets/` | the pop-out widgets (desktop): `constants`, `core`, `popout`, `copies`, `drag`, `resize` (and seams), `groups`, `overlap` (covered frames, shadows), `columns`, `fullscreen`, `board`, `grid`, `arrange`, `keyboard`, `gestures`, `reload`, `refresh`, `layout` (the arrangement as data: read, checked, applied, written), `responsive` |

### How the modules work together

- **Imports.** Modules import each other freely, cycles included. A cycle is harmless because no module runs anything when it is imported other than defining constants: every listener and every start-up step is a function an entry calls.
- **State.** Each piece of state belongs to one module and is read through its functions (`isDashboard()`, `getUserPresets()`, `snapColumn(side)`…), never through a variable another module exports. State kept per element (a widget's group, its gap in the page, a frame's gate before fullscreen) is in `WeakMap`s in the module that owns it, not in properties on the element.
- **Events.** A change other parts show is announced on the event bus (`lib/events.js`: `dialog-toggled`, `map-config-changed`, `map-fullscreen`, `layout-changed`, `grid-changed`, `refresh-changed`, `refresh-tick`) rather than pushed into them: the grid does not know the tab or the dialog exist.
- **Commands.** Every action a control or a key can run is registered by id in `page/commands.js`, with the keys bound to it and when a key may run it (`registerCommand`). The markup's `data-action` controls, the rendered buttons and the tab's glyphs run them through one click listener, the keys through one keydown listener, and a title names its bound key (`withKey`). The text-field and modifier guard is written once, there.
- **Map types.** What a kind of map means (how it is drawn, whether its widget keeps an aspect, whether it has a fullscreen, how it is reloaded) is one entry in `MAP_TYPES` (`maps/types.js`); nothing else switches on a type.
- **The dialog.** The settings dialog is rebuilt on every open. Its sections do not call one another: what one changes that another shows goes through the panel object in `settings/panel.js`, which holds what the dialog is editing (a mediator). It subscribes to the bus once and hands each event to the dialog that is up.
- **After a gesture.** `arrangementChanged()` (`widgets/layout.js`) works out the groups and the overlaps again, stores the arrangement with the view and announces it.

### Types

`jsconfig.json` has TypeScript check every module against its JSDoc (`checkJs`; `strict` is off). The shapes the modules pass around are named where they are owned:

| Type | Where | What |
|---|---|---|
| `CatalogMap`, `TitledSlide`, `MapLink` | `maps/catalog.js` | one map of the catalog |
| `MapPrefs` | `maps/prefs.js` | the view, as stored and as a link carries it |
| `Preset` | `maps/presets.js` | a built-in or saved preset |
| `SnapLayout`, `ColumnLayout`, `PaneEntry`, `FloatingEntry` | `widgets/layout.js` | the arrangement, as data |
| `SnapColumn`, `Pane` | `widgets/columns.js` | a snap column on screen |
| `RenderOptions` | `maps/render.js` | what the customize page passes the renderer |

`query()` and `queryAll()` (`lib/dom.js`) return HTML elements, so what they find has its `style` and `dataset` without a cast; `el()` returns the element type of its tag.

### Stacking

Every page-level `z-index` is one of the layers named on `:root` in `styles.css`, in one ordered list: `--z-progress` at the bottom, then the columns' ground, the grid, the shadows beside a fullscreen map, a fullscreen map in a widget or column, the shadows, the widgets' band (`--z-widgets` to `--z-widgets-top`), the columns' handles, the snap preview, a fullscreen map over the page, the backdrop, the dialogs and the menu. The scripts read the layers they need from there (`cssNumber()`) rather than repeating them.

A raise gives a widget the next number in the widgets' band. Once the numbers reach the top of the band they are dealt again from its bottom, the order kept (`repackPopouts()`), so no amount of use lifts a widget over the columns' handles or a fullscreen map.

## Maps

Both pages draw their maps from one catalog (`MAP_CATALOG`, [`maps/catalog.js`](./src/_assets/js/maps/catalog.js)) into `<div data-maps>`, with the same code ([`maps/render.js`](./src/_assets/js/maps/render.js)):

- the landing page ([`src/index.html`](./src/index.html)) draws the default view, `DEFAULT_MAPS` ([`maps/landing.js`](./src/_assets/js/maps/landing.js));
- the customize page ([`src/customize/index.html`](./src/customize/index.html)) draws the view the user picked ([`maps/view.js`](./src/_assets/js/maps/view.js)), every title bar carrying the widgets' buttons. It passes those in (`WIDGET_RENDER`), so the renderer knows nothing of widgets and the landing page's script carries none of them.

Each map is one `.map-entry` in the list: its `.map-block` (title bar, map, indicators) and the links bar under it. The render runs once the document is parsed, before the wiring (`initDynamicContent`) and, on the customize page, before the remembered arrangement is applied. `src/extras/index.html` is only a redirect stub to the customize page, kept for old bookmarks.

### Map descriptors

Every map is one object (`CatalogMap`) with:

- `id`, which is written into saved preferences and shared links, so once published it stays;
- `category` (radar, satelit, munje, …), shown as a glyph in the picker (`CATEGORY_GLYPHS`);
- `name`, shown in the picker and on the title bar (`title` gives the bar a fuller one);
- `titleHref`, optional `maxWidth` and `aspect`, and `links`;
- `backdrop`, optionally: a `data:` URL standing in for the image a letterboxed widget's backdrop would otherwise take from the map. Only a `video` needs one, having no image to take (see *Freeing and letterboxing*). It is scaled to cover and blurred by 14px, so one frame at 64×43 and JPEG q60 looks the same as the full one and costs 1.8 kB;
- a `type`, the key into `MAP_TYPES`:

| type | notes |
|---|---|
| `slideshow` | `slides` is an array of image URLs, or of `{ title, img, aspect }` objects when each slide has its own title bar (`title.text` may be left out to use the map's `name`, when only the `href` differs). `startSlide` (1-based) loads at once, the rest lazily unless `eagerSlides`. `dynamicWidth` sizes the container to the active slide, and only works on titled slideshows: `updateSlideshowWidth()` reads the active slide's `.placeholder`, which untitled slides do not have |
| `image` | a single `img`, optional `alt` |
| `video` | an mp4 `src`; without an `aspect` the `.vid1` padding gives the box its shape |
| `iframe` | an interactive map with the HR/EU zoom switch, the overlay gate and a fullscreen; `frameId` plus `srcHr`/`srcEu` and the four `zoom*` marker strings that `setIframeSrc()` (`page/iframe.js`) swaps for a phone |
| `iframe-basic` | a plain lazy iframe (`src`), no overlay or zoom |

A titled slide's `.slide.active` and its `.placeholder` are both `width: 100%`, so the box comes from the slideshow above rather than the image below. Otherwise a slide, being a flex item sized by its content, falls in to the width of its title's words when its image fails to load (an `img` with `max-width` and no `width` is 0×0 then), and a map whose source is down becomes a small tile. The `.placeholder`'s `aspect-ratio` and `max-width` say how big the map is with no image to ask, and the `img` is centred by `margin-inline: auto`. An untitled slideshow never had this: its container is the `.placeholder` itself.

The repeated link bars come from shared groups (`RADAR_HR_LINKS`, `SAT_EU_LINKS`, …); `except(group, 'Name')` is the "same set minus the map itself" pattern.

### Showings and instance keys

A map can be on screen more than once (see *Copies*), so a block is named twice: by the map it shows (`data-map-id`, the catalog's) and by which showing of it this is (`data-inst`). The render's own block is the first showing, so its instance key is the plain id, which is why every layout written before copies existed still reads; a further one carries `#2`, `#3`. `instMapId()` and `instIndex()` take a key apart.

The ids inside a block (a slideshow and its indicators, a frame and the ids built off it) take a suffix from the index instead of the key (`instSuffix()`, `Copy2`): a frame's id is pasted into other ids (`reset…Frame`, `overlay…Frame`) and read back with `getElementById`, where a `#` has no place. The first showing gets an empty suffix, so the original's ids are what they always were.

## Presets, preferences and share links

### Presets and preferences

`DEFAULT_MAPS` (in the catalog) is the default view: the landing page's list, and the customize page's until the user picks another. `MAP_PRESETS` lists the built-in presets, each carrying its own `maps` list so resolving one is a plain lookup:

- `zadano` is the default set, shown as *Osnovno*; the id stays `zadano` because it is written into saved preferences and shared links;
- `vise` is the former extras set, `sve` the whole catalog, `nista` none.

*Primijeni* stores the view as `mapPrefs` (`{"preset":"radari"}` or `{"preset":"custom","maps":[…]}`, with the arrangement as `layout`), draws the maps again and wires the fresh DOM (`initDynamicContent()`: lazy images, swipe, iframe `src`, overlays, link shadows, the progress bar). `renderMaps()` takes a fullscreen map down first (`exitFullscreen()`, with persistence paused): the map goes with the list, and the page's scroll lock would otherwise stay behind it.

### Saved presets

Below the picker sits the management list: *Zadani predlošci* first, then *Moji predlošci*, the order the preset bar puts them in. There the current selection is saved under a name (`mapUserPresets`), then renamed, shared or deleted.

- Saved presets have the same `{ id, name, maps }` shape as the built-ins and are appended to them by `allPresets()`, so the preset bar, `presetMapIds()` and the stored preferences treat both alike.
- Their ids are prefixed `u:`, out of the built-ins' namespace, which leaves the name free to change: renaming never breaks a saved preference.
- Saving under an existing name overwrites that preset, so the name is the handle. It is trimmed, collapsed and capped at `PRESET_NAME_MAX`.
- In the preset bar a saved preset carries a corner triangle (`.ms-chip.ms-user`, a `::after`, so it costs no layout).

**Ažuriraj.** Pick a saved preset's chip, edit the list, and its row's *Podijeli* becomes *Ažuriraj*, writing what is on screen over it. Both this and saving by name end in `storeUserPreset()`, so a preset's contents have one write path and its id survives: preferences and links naming it follow the change.

- The link hangs off `editingPresetId`, the preset the list was *loaded from*, not the bar's selection, which an edit flips to *Prilagođeno*.
- It shows only while the list on screen differs from what is stored, and only on that row: an unrelated list must never overwrite a preset.
- `editingPresetId` holds built-in ids too (they carry the origin dot), so the `isUserPresetId()` guard in `hasPendingEdits()` matters: a built-in reaching `storeUserPreset()` would fork a saved copy of itself instead of updating anything.
- It takes *Podijeli*'s place rather than a fourth slot: three action columns fit a phone row beside the name, and a fourth drops every row's actions onto a second line. Sharing is the one to give up while a row has unsaved edits, since the row's link shares the preset *as saved*, and the panel's own *Podijeli* covers the list on screen. Anything added here later has to replace a slot too.
- Like the rest of the panel it saves the preset only; the page still needs *Primijeni*.

**Hiding.** Built-ins cannot be deleted (they are code) but can be hidden from the preset bar (`mapHiddenPresets`). Hiding is a display choice only: `allPresets()` keeps returning them, so a saved preference, the `zadano` fallback and a shared link naming a hidden preset all still resolve; only `visiblePresets()` filters. `zadano` cannot be hidden (`PERMANENT_PRESET_ID`), so the bar never comes down to *Prilagođeno* alone.

**Deleting** is the one panel action that writes without *Primijeni*, so `deleteUserPreset()` also rewrites a `mapPrefs` naming the deleted preset into a `custom` copy of its maps. Otherwise it would fail `isValidPrefs()` on the next load and fall back to *Osnovno*.

### The origin dot

Changing the selection or its order selects *Prilagođeno* and dots the chip the list came from (`.ms-chip.ms-origin`, a `::before` at the left edge, clear of a saved preset's corner triangle), so the bar still names the view the edits are a copy of. Clicking the dotted chip reloads that preset and drops the edits, with no extra handler: *Prilagođeno* holds the selection, so the origin chip is the unchecked one and its `change` fires as usual.

The selection deliberately does not stay on the origin chip. What a share link can carry for an edited preset is a bare list, not a name: a modified *Osnovno* is not `zadano`, and shipping `name: "Osnovno"` would plant a preset of that name holding different maps. The flip to *Prilagođeno* is what tells you, before *Podijeli*, that a list travels.

The preset bar is rendered after the list is filled (`presets.render()` after `list.fill()`), since it reads the list back to place the dot and would read an empty one as edited away from every preset.

### Share links

*Podijeli* copies a link carrying the panel's view, URL-safe-base64 encoded in `?v=`.

- On load the parameter overrides the saved preferences **for the session only**; it never writes to the recipient's storage.
- It stays in the address bar (refresh-safe, re-copyable) and is removed through `history.replaceState` once the user applies a view of their own.
- The clipboard API needs a secure context (https or localhost); elsewhere a prompt shows the link to copy.

A built-in preset travels as its id, which every visitor resolves. A saved preset's id means nothing to a recipient, so it travels as its contents plus its name (`preset: 'custom'`, `maps`, `name`), and the panel offers to save it under that name, made unique against the recipient's own presets so nothing of theirs is overwritten.

Arriving without an id, such a link would always open on *Prilagođeno*, even your own, where the list is a preset you already have. `activePresetId()` matches it back with `presetIdForMapIds()`:

- on contents and order only: the name is a label the recipient may have used for something else, and a renamed preset is still the same view;
- saved presets first, so a saved copy of a built-in list selects the copy;
- matching also drops the offer to save it, which would only add a suffixed duplicate.

Only a shared view is matched this way. A `custom` in stored `mapPrefs` is a list the user chose not to save, and binding it to a preset id would hand later edits of that preset to a view that merely matches today.

When extending the payload: `btoa()` rejects code points above U+00FF, and the name is typed by the user, so every Croatian diacritic (č ć š ž đ) is above it. `encodeMapView()` escapes non-ASCII to `\uXXXX` before encoding, which keeps the input ASCII and needs no counterpart in `decodeMapView()`, since `JSON.parse` reads those escapes back on its own.

## Remote config

A map whose source is down is switched off without a build: the file at `MAP_CONFIG_URL` names the maps that are off, as `{ "maps": { "<id>": { "enabled": false } } }`. Anything else in it is ignored, and a map the file does not name is on.

The code is [`remote-config.js`](./src/_assets/js/remote-config.js), started by both entries before anything draws.

- The file is fetched on every load, but nothing waits for it. What the page applies is the last copy this browser saw (`mapConfig` in storage), read at once; the copy just fetched is stored for the next load.
- If it differs, the change is applied in place, so a flip reaches a visitor on their next load, or within seconds on a page they have open.
- A first visit has no copy, so it shows every map until the fetch lands.
- A failed fetch keeps whatever copy there is, so the file out of reach never hides anything it was not told to.
- `cache: 'no-cache'` makes the browser revalidate, so a flip is not held back by HTTP caching.

Off means hidden, not removed, on both pages. Both leave a switched-off map out of what they draw and draw again on a change (`map-config-changed`): the landing page its list, the customize page its view, carrying the arrangement over from the screen.

On the customize page the tab's `[+]` menu leaves the map out too. The dialog still builds its row but hides it (`.ms-off`, in either section, and left out of the find box's hit count), so the list the dialog reads back off its rows keeps the id where it was. Stored preferences, saved presets and share links therefore still hold a map while it is off, and it comes back in its place once it is on. The one thing a map loses while off is its place in a stored arrangement: the next write reads the screen, where the map is not, so it comes back docked on the page, or down the cascade on a board.

## Dialogs

There are two dialogs, the picker and the manual, and one set of chrome under both ([`page/dialog.js`](./src/_assets/js/page/dialog.js)), since the landing page carries the manual too. A panel is a dialog by carrying `.map-settings`, and names its storage key with `data-dialog-key` (`msPanel`, `manualPanel`).

- **One at a time.** Opening one shuts the other, so there is a single backdrop, a single scroll lock and a single Escape to reason about.
- **Announced.** `setDialogVisible()` announces every change on `dialog-toggled`, the dialog shut to make room as much as the one asked for: what hangs off a shut (the *Karte* button's arrow, the manual's hash) has no other way of hearing about it.
- **Over everything.** A dialog is a fixed panel at body level, over the page, the columns, a fullscreen map and the widgets, so it can be reached from any state of the page. It is not modal in the sense of freezing the arrangement, but the page holds still under it.
- **Scroll.** `body.ms-open` locks the page's scroll and hands it to the dialog's `.ms-body`, the `.ms-head` above staying put. The body has `overscroll-behavior: contain`, so the wheel stops at its end, and on the desktop a classic scrollbar in a stable gutter (the overlay kind shows an empty track until hovered and lies over the row handles). Below the breakpoint the native overlay scrollbar stands, as on everything else on a touch screen.
- **Gutter.** The lock drops the page's scrollbar, which would widen the page and shift what is centred in it, so `html.ms-gutter` keeps the gutter (`scrollbar-gutter: stable`) while a dialog is up, when there was one. `clientWidth` then counts a gutter nothing is drawn in, so `setScrollbarGutter()` has `viewportWidth()` take it off, and the columns are laid out again.
- **`[hidden]`.** A dialog's `display: flex` would beat the `hidden` attribute, so the CSS restates `display: none` for `[hidden]`.

**The backdrop.** A press anywhere outside the dialog shuts it, dropping what was edited (it is rebuilt from what is stored on the next open). The press lands on `.ms-backdrop`, which is over everything the dialog is over and under the dialog and the tab, so the dismissal reaches nothing else: no link is followed, no button pressed, no widget taken. It dims rather than blurs, since the maps behind are what the list in front is being picked for, and a blur would composite every live frame on the page.

A press is three events, and all three belong to the dismissal, so the backdrop stands until the click has been taken:

- the `pointerdown` stops it painting at once (`ms-spent`);
- the click is swallowed in the capture phase, ahead of every listener on the page;
- the release arms a 400ms fallback for gestures no click follows (a pointer let go outside the window, a drag);
- if a dialog has been opened again meanwhile (`K`, the tab), the backdrop stays.

The `.ms-tab` keeps its own click above the backdrop and shuts the dialog the same way. So the only thing that changes the arrangement with the dialog up is *Vrati sve* on its layout line; working the widgets takes one press to dismiss, then the gesture.

**A window, on the desktop.** A dialog is dragged by its head and resized from any side or corner through the widgets' own `.po-h` handles, appended inside the panel so the press that grabs one is a press inside the dialog.

- Until it is resized its height is the content's, capped to what is left below its top; a resize pins an explicit height.
- Where and how big (`msPanel`, `manualPanel`): left and top as fractions of the viewport, width in px, and height in px once pinned. Applied on open (measurable only once shown) and on a window resize, so it cannot be stranded off screen. A press that never moved stores nothing.
- A double-click on the head drops the lot and gives the CSS its dialog back.
- A link or button on the head is itself: *Zatvori*, and at the left end the way home (`.ms-home`, below).

**On a phone** the dialog is the full-screen one the CSS draws, with no gestures. It drops its border (there is nothing left for an edge to divide it from), and its height is `100dvh` (after `100vh` for browsers that do not know the unit): `vh` is the taller viewport a collapsible URL bar is measured out of, which hangs the dialog's foot below the screen and the last of the preset management out of reach. The head gives its padding to its children, so *Zatvori* is tapped anywhere in the right end of the bar and the title anywhere in the left.

### The settings dialog

`#mapSettings`, opened by the page's *Karte* button, the tab, or `K`. Shut by *Zatvori*, the button, the tab, Escape, `K`, or a press outside. Escape stands down in a text field: the name and rename editors have an Escape of their own.

- **The way home.** At the head's left end, before the title, `.ms-home` leads to the landing page, which the board and a hidden page take out of sight. Its image is the site's favicon, taken off the page's own `<link rel="icon">` so the build's rewritten path comes with it, and it is a real link resolved as `../` off the page's address (`/meteo/` in the build), so Ctrl and the middle button open it beside the page.
- **Two lists of the same rows.** `.ms-selected` is the render order, reordered by dragging a row's `≡` handle; `.ms-available` below it is a finding surface, sortable by name or category without touching the order, which is why it alone has the sort links and the find box. Ticking a map appends it to the order; unticking returns it to the shelf.
- **Rows above the lists.** The preset bar (`panel-presets`); the board's mode row with its grid switches and *Posloži*, the auto-refresh row, and the layout line (`panel-rows`; see *Remembered and shared layouts* and *The board*).
- **Enter** is *Primijeni* wherever the focus is in the picker. It is taken in the capture phase and kept from the focused element, since a button just pressed (the mode row's) would otherwise take it as a second click and undo itself. Text fields and the interval `<select>` keep their own.

**Find.** A term is matched against the map's name and its category, every term of several having to hit, both sides through `foldText()`: `normalize('NFD')` splits a diacritic off its letter so the mark can be dropped and *chmu* finds *ČHMÚ*. A stroke is a letter of its own (`đ` is one code point and decomposes to nothing), so it is spelled out.

- A row that misses is hidden (`.ms-filtered`) rather than taken out of the list, since it carries its checkbox and drag handler, and a term is cleared far more often than the catalog changes. The rule is scoped to `.ms-available`, so the class a ticked row carries up into the order is inert there.
- The order above is not filtered: a row dropped between two visible neighbours would land somewhere else entirely once the term was cleared.
- The term stands through a preset picked and a row returned, and is applied again wherever rows arrive.
- `:empty` cannot speak for a list whose rows are all merely hidden, so `.ms-no-hits` carries that message.

### The tab

Where the page's *Karte* button is gone (hidden behind full-width columns, `body.snap-full`, or on the board, `body.dashboard`) a fixed `.ms-tab` hangs from the top edge to open the dialog, in the site's orange on white: there it is the only way to the dialog. On the board it hangs over the maps the whole time, so it is faint (`opacity: 0.55`) until the pointer or an open dialog lights it. It is not shown over a fullscreen map (`body.fs-lock`): that map has its own ways out, and a tab over it would be chrome in front of the one view that asked for none.

- **Glyphs.** On the board it carries a cluster as a title bar does (`buildMsTabCluster()`): `[+]` adds a map (below), `[R]` reloads every map, `[A]` arranges, `[G]` and `[S]` are the grid switches, each titled with its key. `[G]` and `[S]` are lit or dimmed on `grid-changed`, wherever the switch was flipped. The glyphs are `<a>` without `href`, which a `<button>` may contain, and a press on one (`.ms-tab-btn`) is kept off the tab's own drag, resize and open.
- **Auto-refresh.** `body.refresh-on` shows the tab off the board as well, carrying `[R]` and the countdown; the board's glyphs stay board-only.
- **Placing.** The tab is dragged along the top edge and pulled wider or narrower by either side (a press within `MS_TAB_EDGE` of a side resizes, elsewhere it drags; a release that moved is no click). It is no narrower than its name and cluster together (`msTabMinWidth()`, which is also its width until it is pulled) and no wider than half the viewport (`msTabMaxWidth()`); the floor wins over the ceiling on a narrow window. Pulled narrower than its content, the name gives way to an ellipsis.
- **Remembered** in this browser only (`msTab`: the left as a fraction of the viewport, the width in px), not in the arrangement, since it is about this screen and not the view. Applied on load and on a window resize.
- Desktop only: below the breakpoint the tab is not placed at all.

### The add menu

The tab's `[+]` (`.ms-tab-add`, on the board only) adds a map without the dialog. `openMsAdd()` hangs a menu under the tab (outside it, since a `<button>` is no place for a text box) listing the catalog's maps the list does not hold, by name as *Naziv* sorts them, narrowed by the dialog's own `findTerms()`/`matchesFind()`. The arrows walk it with the focus kept in its box, so the page's keys stay off it; Enter or a click adds the lit map (`addToDashboard()`); Escape, a press outside, the dialog opening or a resize shut it. It is built afresh on every open.

## Widgets

The customize page's maps can be lifted off the page into widgets: fixed, draggable, resizable windows over it. Desktop only (`DESKTOP_MQ`: `min-width: 801px` with `hover: hover` and `pointer: fine`, the same query in the CSS): it gates the gestures and the buttons, and crossing below it docks every widget, with persistence paused.

### Pop-out

On desktop every title bar carries a `[^]` button that lifts the map out of the list into a widget, so one or more maps stay visible while the rest of the page scrolls. The button is in the map's title bar, or on each slide's bar for a titled slideshow without one.

Like the interactive map's fullscreen it is classes and inline styles only; nothing moves in the DOM, which would reload an iframe. `popoutMap()`:

- adds `.popout` (`position: fixed`);
- sets an inline `width` (`POPOUT_WIDTH`, or narrower if the block already was) and `left`/`top` at the block's place on screen, so it reads as lifted rather than teleported;
- leaves a `.map-gap` of the block's height in its place, so the list does not jump. The gap's *Vrati* and the button, now `[=]`, both call `dockMap()`, which removes the classes, the handles, the gap and every inline property.

**The title bar.**

- `[R]` (`.rl-btn`, first in the cluster while the widget is out) fetches the map afresh without reloading the page: images and video sources get a `_r=` parameter (`freshUrl()`, replaced on the next press) so the browser fetches past its cache, and a basic iframe is navigated to its `src` again. An interactive map's bar has its own `[X]`/`[R]` gate button instead.
- The button clusters sit on the bar out of flow, so on a narrow widget the title would run under them. `fitTitles()` centres it in the gap between them instead (from the pop-out on, so it never jumps between two centrings), through a `--title-shift` the CSS folds into its transform, and gives it the gap's width with an ellipsis. `fitLetterbox()` (below) is measured at the same moments, and the two go out together as `fitWidget()`: at the end of every gesture, when a button comes or goes, live during a resize and a column layout, and after a click or pointerup in the widget, which is what brings a slide's bar on screen. A bar not on screen measures nothing and is left for then.

**Locked and free.** Images, slideshows and videos are *locked*: their height follows the width (`aspect-ratio`, `.vid1` padding). Iframes have no aspect of their own, so their widgets are *free* (`isFreePopout()`, `.free`): the block carries an inline `height` too, starting from what the `.if1`/`.if2` padding gave it, and lays out as a column in which the map takes what the title bar leaves.

The map's own width, written inline by `maxWidthStyle()` on the title bar, the placeholder, the slideshow and the indicators, is the page's answer to a wide screen. A widget is not the page: its width is the map's, so the CSS undoes the caps throughout a `.popout` and gives the image `width: 100%`. A locked widget therefore goes as wide as it is pulled, the map following it, and a stored width is restored as stored, held to the widget limits alone (`POPOUT_MIN_WIDTH`, `popoutMaxWidth()`).

**Positions** are written to the thousandth of a pixel (`subpixel()`, used by `placePopout()` and `moveGroup()`). A locked widget's height is its title bar plus the width over its aspect, so its bottom edge lands on a fraction, and a widget pulled under it onto a whole pixel would overlap it by half a pixel: both borders drawn, a seam one and a half wide. `placePopout()` keeps a widget inside the viewport, on a drag and on a window resize alike.

### Dragging and magnets

A drag is a `pointerdown` on a widget's title bar (not in fullscreen; links and buttons on the bar are themselves). Gestures go through `trackWidgetPointer()` (`lib/pointer.js` under it), with move and up listeners on `document`:

- `preventDefault()` on the `pointerdown` also suppresses the compatibility `mousedown`, so a drag by a slide's bar cannot register as a swipe on the slideshow around it;
- `body.po-dragging` turns iframe pointer events off, so a frame crossed mid-gesture cannot swallow the pointer;
- nothing moves until `SNAP_ARM` of travel, so a click on a parked widget does not move it.

Away from the viewport edges the other floating widgets are magnets (`magnetPosition()`, within `MAGNET`): an edge brought close to another widget's opposite edge is pulled onto it (beside it when the two overlap in height, above or below when they overlap in width), and once they meet on one axis the nearer of the like edges lines up on the other, so a widget dropped below another sits flush with its side. The nearest edge wins per axis. The others' rects are read once at the start of the drag (`magnetRects()`, panes and fullscreen hosts left out). A drag never changes a size: the widget is moved onto an edge, not fitted to it.

### Resizing

Eight `.po-h` handles are appended on pop-out: thin strips and corner squares straddling the edge. Pulling the left or top edge keeps the opposite edge in place by moving the widget along.

- **A free widget** resizes in both axes.
- **A locked widget** only ever writes its `width`: a pull on the top or bottom edge becomes the width that gives that height, and a corner follows whichever axis asks for more. That conversion is `lockedWidthFor()`, read off the widget rather than a ratio: the title bar and indicators keep their height at any width, so a ratio is out by about a bar's height, which is all of `MAGNET`. Setting the width and reading back the height it gave closes that in a second pass.
- **Room.** The size is held to the room between the edge that stays and the viewport edge the pull heads for, rather than the widget pushed back inside afterwards, which would move the edge that stays.
- **Magnets.** The pulled edge has the same magnets as a drag (`magnetEdge()`, shared through `pullResizeEdges()`): onto the facing edge of a widget beside it, or into line with the like edge of one above or below. For a locked widget the edge that moves along with the pulled one (the bottom, when a side is pulled) is offered the same magnets and the width taken back from the height that lands on one, which is how a widget widened beside a taller one stops level with its bottom. The derived edge's pull is the last word, and a pull that reaches no magnet leaves the gesture as it was.

**Shift** holds the aspect and a plain pull lets it go, as in an image editor. The key counts through the whole gesture, not only at its start: `trackPointer()` repeats the last move on `keydown`/`keyup` of Shift with the pointer's last coordinates (a `KeyboardEvent` has none), so pressing or releasing it mid-pull takes the aspect back or lets it go where the widget stands.

### Freeing and letterboxing

A plain pull on a locked widget's handle frees it for good (`unlockAspect()`): it takes the inline height it has and `.free`, so every free-widget path applies (its height stored in the layout included), and `.letterbox`:

- the image, the active slide or the video is contained (`object-fit: contain`) in what the title bar leaves;
- behind it a `.po-backdrop` paints a blurred, darkened copy of the image on screen (`--po-img`), which `syncBackdrop()` follows on every load, click and pointerup in the widget, so a slide change or a reload's fresh address shows. A video has no image to take, and none can be read off it (`drawImage()` from a `<video>` taints the canvas, and `crossorigin="anonymous"` would stop idokep's video loading at all), so the catalog's `backdrop` stands in, as it does for a lazy slide not loaded yet.

A letterboxed image is painted smaller than its element, and CSS cannot see the painted rect, so the arrows (absolute in the `.slideshow`) and the indicators would span the whole widget. `fitLetterbox()` works the rect out from the natural ratio against the element's box and publishes it on the block: four insets from the `.slideshow` for the arrows (which takes a slide's own title bar off the top for free), and `--lb-w`, the painted width, for the indicators to centre in and the arrows to keep their share of. The properties are scoped to `.letterbox` in the CSS, and `dockMap()` removes them with the rest. The arrows' `transition` names only the two properties of their hover fade, or they would slide after the image half a second late.

**Locking again.** A Shift-pull on a freed widget locks it (`lockAspect()`: the height its aspect gives at the width it has), as does a double-click on its title bar, which works on a pane too, its stored height going with the lock. The double-click takes `lockToImage()`: a letterboxed image is contained, so one axis is the image's and the other is ground, and of the two ways to take the aspect back (at the width it has, or at the width that gives the height it has) the smaller is the image. The widget only ever comes in, and is left wrapped around the map.

A stored entry with a height on a locked map is one that was freed, and `applySnapLayout()` frees it before placing it.

### Covered frames and shadows

**Covered frames.** An iframe takes the pointer itself: a press inside it belongs to the frame's document, which the page never sees, so a widget whose map is a frame could not be clicked to the front. Most maps are spared by their gate (the `.overlay` over the frame), but a basic iframe has none, and an interactive one loses its own once the gate is let through. So a widget with another lying over it hands the pointer back: `refreshOverlap()` marks it `covered` (a widget of a higher `z-index` meets its rect; a fullscreen host excepted, its map being the thing meant to be used), and the CSS takes `pointer-events` off its frame. The press then lands on the widget and raises it, the mark goes with the raise, and the frame is live for the next press: click it to the front, then work the map, as with a window.

A widget nothing overlaps is never marked. For that one a `blur` on the window, with an iframe left as `document.activeElement`, still raises its widget, keeping the order right for later. It cannot replace the covered case: the focus moving from one frame straight to another raises no event the page can hear.

**Shadows.** No widget draws its own shadow: drawn by the widget, it would paint in the widget's place in the order, and of two widgets side by side the raised one would lay its shadow across its neighbour. Every floating widget has a box of its rect in a shadow layer instead, below the whole widget band and above everything else (the page and its docked maps, the columns' ground, the grid), so every widget is over every shadow. A box paints the halo alone (an outer `box-shadow` is clipped out of its own box), and the rect is taken to the thousandth of a pixel. A pane in a column has none, nor has a widget hosting a fullscreen map.

There are two layers (`--z-shadows`, `--z-shadows-under`) because a fullscreen map in a widget or a column lies between them, and a shadow belongs on what is behind its own widget: `syncShadows()` puts the box of a widget over that map in the upper layer (it casts onto the map as it would onto the page) and the box of one beside it in the lower (the map covers the halo of a widget that walled it off). A widget dragged on and off the map changes layer as it crosses.

`syncShadows()` also sweeps out boxes left without a widget. It runs wherever a rect or the order can have changed: with `refreshOverlap()`, live on every gesture's move, on the `load`/`click`/`pointerup` that changes a locked widget's height, and when everything is docked.

### Groups

Widgets that touch (an edge of one on an edge of the other, overlapping along it, within `GROUP_TOUCH`, which is what the magnets leave: `rectsTouch()`) can be grouped, explicitly only.

- The title bar's `[+]` (`.grp-btn`, shown by `updateGroups()` only on a widget touching another or in a group) joins the widget with what it touches, and with their groups, into one (`joinGroup()`); `[-]` on a member takes it out (`leaveGroup()`). A group left with one member is dissolved; a group whose middle leaves stays a group, though its ends no longer touch.
- Widgets touch only in one place (floating, or panes of one column), so a group is always in one place.
- A group is an id its members share, kept in a `WeakMap` (`groupOf`/`setGroupOf`), and shows as `.grouped` (the frame in the snap blue).

A group moves as one:

- **Drag.** The members move by one offset (`groupStarts()`/`moveGroup()`, or `movePanes()` in a column), with the magnets, the viewport clamp and the column snap seeing the group's box (`groupBox()`). Dropped at a viewport edge it goes into the column as a stack and stays a group; pulled out of a column it floats as one.
- **Raise.** `raisePopout()` brings the members up in their order.
- **Resize** (`resizeGroup()`, off any member's handle while the group floats): one scale for the box, as for a locked widget, from the corner opposite the pull, held so no member goes under its minimum or over the maximum and the box stays in the viewport. Each member is scaled and placed at its scaled offset, then settled onto the members it touched or lined up with before (`groupRelations()`, read at the start), since title bars do not scale and a stack must stay a stack.

In a column a group is a *stack*: every layout of the column (`settleSnapStacks()`) sits the members one under another in the order of their tops, from where the first stands, and holds the stack inside the viewport. A stored stack therefore comes back as one whatever the viewport. A free pane in a stack still resizes on its own, the members above and below moving with its edges. A middle member leaving splits the stack in two. Docking a member takes it out of its group.

### Copies

`[D]` (or `D`) makes another showing of a map. A copy is a widget and nothing else: the page keeps one entry per map however many float over it, so the stored list, `renderMaps()` and the picker are untouched, and there is no question of where a copy sits in a list it was never in.

No showing is the original, as far as anyone at the screen can tell. The entry's one place to dock into belongs to whichever showing holds it (the one not marked `.duplicate`):

- `[=]` (`[x]` on the board) on a showing while others of its map are out takes it away (`removeShowing()`);
- if that one held the place, the next showing inherits it: the class goes, the `.map-gap` passes over, and the gap's *Vrati* docks whichever showing holds it by then. Nothing moves in the DOM: every other showing is a fixed widget, so the heir docks into the gap from wherever it sits;
- only a map's last showing docks, or on the board leaves the list. `dockMap()` still takes a copy away, for *Vrati sve* and the breakpoint, which dock everything.

A copy is built from the catalog rather than cloned from the DOM, so its parts have names of their own (`buildMapContent(map, inst)`, `instSuffix()`): two renderings sharing one `data-slideshow-id` would have the arrows drive whichever came first while both sets of indicators lit up (which is also why `prefsMapIds()` drops a map listed twice).

- It is inserted next to the showing holding the page's place, so the DOM still reads as the list's order (which `arrangeBoard()` relies on) and an entry removed takes its copies with it. It leaves no `.map-gap`.
- `freeInstance()` gives it the lowest name no block carries.
- It takes the size of the widget it came from, held to the widget limits: the width, and the height where the height is the widget's own (an interactive map, or one freed of its aspect, which the copy is freed of too). A copy of a docked map starts at the size any widget starts at.
- `wireDuplicate()` wires the copy and only the copy: `initDynamicContent()` sweeps the page, and setting an iframe's `src` again would reload every interactive map on screen, costing each its pan and zoom. The two sweeps it does call are safe because `addSwipeEvents()` and `hideOverlayOnDoubleTap()` mark what they bind (`data-swipe`, `data-tap`) and skip it next time.

In the arrangement a copy is named by an instance key (see *Remembered and shared layouts*), so copies ride in a preset and a link like the rest of the arrangement, and a map dropped from the list takes its copies with it.

### Snap columns

A widget dragged until its own edge reaches the left or right edge of the viewport (`SNAP_EDGE`, wherever the bar is held; the position the pointer asks for is checked, not the clamped one, so pushing on past the edge still counts) snaps into a column there. On the page only: the board has none.

- **Layout.** A column is a strip of the viewport's height in which panes sit freely one above another; the page is laid out in what is left between the columns (`body` padding through `--snap-l`/`--snap-r`, so the list centres in the remaining width). Sizes come from `viewportWidth()`/`viewportHeight()`, the document's `clientWidth`/`clientHeight`: `innerWidth` counts the vertical scrollbar, under which a right column would otherwise land.
- **A pane** is still a widget (same block, same classes, same fixed positioning; nothing moves in the DOM); only its width is the column's and its place comes from `layoutSnapColumns()`. A column (`SnapColumn`) holds a `width` and its panes (`{ block, top, height? }`), every number a fraction of the viewport, so a window resize keeps the proportions. A free pane carries its height; a locked one takes the column's width and the height its aspect gives at it, and is laid out again on a `load`, `click` or `pointerup` inside it (a titled slideshow changes aspect with the slide).
- **Moving.** Up and down its column a pane is dragged as a widget is over the page, the column's ends and the other panes' tops and bottoms its magnets (`paneMagnetEdges()`, `paneTop()`); dragged `SNAP_DETACH` sideways, `unsnapPane()` floats it again as it stood, and it can be dropped straight back into either column.
- **Resizing.** A pane resizes by its top and bottom handles against the same edges (the other handles are hidden in a column, the width being the column's). A locked pane's height is the only thing a pull can change, and letting the aspect go is the only way to change it: a plain pull frees it, Shift holds it, and the double-click takes the aspect back, dropping its stored height.
- **The drop** is previewed by `.snap-preview` at the slot `snapSlot()` gives (the column's width, or for a new column the widget's own, clamped to what the other column leaves; the top the widget asks for, pulled to the column's magnets), and `snapPanes()` stacks the dropped widgets there, so a group drops in as one.
- **Handles.** Two fixed elements per column: `.snap-col` paints its ground below the panes, `.snap-ui` above them holds the inner-edge handle (`resizeSnapColumn()`, up to what the other column leaves).
- **The whole width.** The columns can take the whole width (two meeting, or one at full width), which hides the page: `isSnapPageHidden()` reads it off the fractions summing to one, since the pixel viewport changes at that very moment (`body.snap-full` drops the page's scrollbar). An edge dragged within `SNAP_SHUT` of what the other column leaves snaps shut. Two columns that meet share one seam handle that moves width between them (`resizeSnapSeam()`). A double-click on an edge hides the page, or, when it is hidden, brings it back to the widths from before (`snapPageWidths`), failing those scaling the columns down to leave the list's width.
- `dockMap()` unsnaps first, so `[=]`, *Vrati* and the breakpoint work on panes as on widgets; `renderMaps()` resets the columns, since the panes go with the list.

### Fullscreen

An interactive map's `[ ]` puts it in fullscreen: classes on its bar and frame (`page/iframe.js`), nothing moved. `toggleFullscreen()` locks the page's scroll only for a map not in a pane (beside a column-filling map the page stays in use); it and `exitFullscreen()` emit `map-fullscreen`, on which `widgets/fullscreen.js`:

- marks the widget hosting the map `.fs-host`. Only the bar and the map go fullscreen; the widget's box (frame, shadow, handles) would stay behind as an empty frame, so it goes `visibility: hidden`, the two fullscreen children visible again;
- lowers the host into `--z-fullscreen-host`, under every other widget and over the columns' ground (the raise skips it meanwhile), and raises it again when the fullscreen ends. So the widgets floating over the page stay in view over a fullscreen map: it never covers another widget, only the page or its column;
- lays the columns out again for the viewport the scroll lock's scrollbar has just changed.

**Where it fills.**

- On the landing page and a page without columns, the whole viewport.
- In a column: over what the column leaves free around the pane. `fitSnapFullscreen()` sets `--fs-top`/`--fs-bottom` on the host to the bottom of the panes above and the top of the panes below (the column's ends where there are none), never less than a map's minimum height. The CSS puts the bar and the map between `--snap-l` and `--snap-r` (the frame's `width: 100%` undone there), and a pane's `.snapped-left`/`.snapped-right` moves them over its column, following a column edge live.
- Under `body.snap-full` a floating widget's fullscreen takes the whole viewport.
- On the board: the whole viewport, except where other widgets *wall it off* (`fitBoardFullscreen()`, all four `--fs-*`). A side comes in only where the widgets on that side together cover the rectangle from end to end of its other axis (`freeRectAround()`). A widget down the left of the screen leaves the right half a region of its own, and the map fills that; a widget in a corner walls nothing off and is floated over, staying where it is above the map. A widget over the host is on no side of it and never a wall. The walls are looked for again once a side has come in, since a narrower rectangle is one a widget may reach across; every pass only narrows, so it settles in a pass or two. Coverage allows a gap of `POPOUT_MARGIN`, the margin a stored size is clamped short of the viewport by, and the grid's cell besides. There is one wall search: the other three sides are the left one mirrored, transposed, or both. The host's box is still there to read under its fullscreen because every map with a `[ ]` is interactive and so a free widget with an inline height. It is fitted again on `map-fullscreen` and whenever the overlaps are worked out, and the properties are cleared off every floating widget not hosting one.

`Escape` ends a fullscreen map (it is a class, not the browser's own fullscreen, so nothing else would). The bar's `[=]` is hidden in fullscreen; the gap's *Vrati* still docks such a widget, and `dockMap()` takes the fullscreen down first.

### Remembered and shared layouts

The arrangement is part of the view, so it travels with the map list rather than on its own: `layout` next to the list in `mapPrefs`, in a saved preset (`{ id, name, maps, layout }`) and in the `?v=` payload. `snapLayout()` writes it (`SnapLayout`):

- per side the column's width and its panes, each an instance key with its top, and a height for a free pane;
- the widgets floating over the page (`floating`, bottom to top so they stack the same way again): key, left, top, width, and a height for a free one;
- `dashboard: true` for a board;
- a group as a number its members' entries share, counted in order of appearance;
- `fullscreen: true` on a pane or widget hosting a fullscreen map, so a view saved from that state comes back in it;
- every number a fraction of the viewport, rounded to four places; `null` when nothing is out.

**Instance keys.** The keys are not the blocks' `data-inst`: which showing is which only holds for the moment, so `layoutKeys()` deals them afresh on every write, the showing holding the page's place first under the plain id, the rest `#2`, `#3` in the page's order. A layout never names a copy without the map itself. On the way back the plain key is the page's showing, whatever it is called by now, and any other is a copy made under a free name (`instanceFor()`).

**Read back.** `sanitizeSnapLayout(layout, mapIds)` holds every layout read back (storage, links, saved entries) to the list beside it:

- an entry must name a map in the list, once across the columns and the floating widgets;
- a pane must carry a top; one stored before panes were placed freely has a height `share` instead, and those are stacked from the top as they stood;
- the widths are bounded to the viewport, a bad width drops its column, an emptied column goes, a floating entry with a number out of range is dropped;
- `fullscreen` is kept only on a map that has one (`hasFullscreen()`, by type);
- a group needs two members in one place;
- a board keeps no columns (see *The board*);
- the keys keep their order, since layouts are compared as JSON (`sameSnapLayout()`) and an old one must still compare equal to itself read back.

**Applied.** `applySnapLayout()` rebuilds the arrangement after a render, with persistence paused, since what is being applied is what is stored: the board's mode first (its scrollbar changes the viewport everything after is measured in), each pane popped out and attached as it stood (`attachSnapPane()`), the widths set, each floating widget popped out, sized within the limits, placed and raised in order, then the flagged maps put fullscreen last (`restoreFullscreen()` clicks the map's own `[ ]`, so everything a click does happens). On load `applyStoredSnapLayout()` runs once the maps are rendered. Desktop only: a phone carries the layout and does not show it.

**Written as it changes.** It is direct manipulation, not a form with an apply button, so `arrangementChanged()` writes it at the end of every pop-out and dock, drag and resize, snap, handle drag and page toggle, and on `map-fullscreen`: into `mapPrefs` next to whatever list is there (`storeViewLayout()`), or, under a shared view, into that view and back into the address bar, so the link stays re-copyable with the arrangement as it is now and a refresh keeps it, while the recipient's storage is never written.

**Below the breakpoint** the widgets are docked with persistence paused (`withPersistPaused()`): that is the window changing, not the arrangement. `applySnapLayout()` places nothing there either, so the screen would describe an empty board while the preferences still hold a desktop arrangement. The arrangement a narrow window cannot show is kept (`unappliedSnapLayout`: by `applySnapLayout()` on a narrow load, and by the breakpoint on the way down, read before the dock empties the screen), and everything that writes the arrangement or asks what the view holds goes through `currentSnapLayout()`, which answers with the kept one while there is one. Widening applies it and clears it.

**In the dialog.**

- *Primijeni* decides which arrangement the new list gets (`layoutForPrefs()`). A preset is a whole view, so a saved one brings its own (none, if it was saved with nothing out) and a built-in, having none, docks everything. Only the custom list keeps the one the view holds (`currentSnapLayout()`), as far as its maps allow, since that is an edit of the current view.
- Saving a preset (*Spremi*, *Ažuriraj*) stores the arrangement on screen, held to the list in the picker and to the mode row's toggle (`selectedLayout()`), and `hasPendingEdits()` counts a changed arrangement as an edit, so a rearranged page offers *Ažuriraj* on the preset it was loaded from. (The origin dot marks a changed list only.)
- Sharing carries it the same way: the panel's *Podijeli* with what is on screen, a saved preset's row with its own (`presetSharePrefs()`).
- The `.ms-layout` line names what is out (*Izdvojene karte: lijevo 2, desno 1, u prozoru 1*), with *Vrati sve* to dock it all. It stays hidden on the board. Since *Vrati sve* changes the arrangement with the dialog open, the dialog redraws the line and the management rows on `layout-changed`, and *Ažuriraj* appears or withdraws at once.

### The board

The *board* (*nadzorna ploča*) is the page out of sight and every map of the list a floating widget. It is a mode of the view, not a page of its own: `dashboard: true` on the layout, so it rides with the list in the preferences, a saved preset and a share link.

**Entering.** The dialog's mode row (`.ms-mode`) is the only way on: its button is a toggle like the list's ticks (`dashboardChecked`), nothing moves until *Primijeni*, and whether it is ticked is `aria-pressed` and the lit band's to say. *Primijeni* takes the arrangement `layoutForPrefs()` picks and `withDashboard()` sets the mode on it, before `sanitizeSnapLayout()`, so what it marks a board is held to what a board can hold:

- ticked, any layout becomes a board, an empty one included, which `applySnapLayout()` fills with every map of the list;
- unticked, a board loses its placements with the flag (`null`, everything docks): a board holds the whole list, and over the page that is a pile;
- a page layout is left alone either way.

Picking a preset chip sets the toggle to that preset's own mode (a saved board ticks it, a saved page and every built-in untick it, *Prilagođeno* leaves it), and a changed toggle is a pending edit like a changed list. A saved preset that is a board (`isBoardPreset()`) carries the mode row's blue edge (`.ms-board`) on its chip and its name.

**On the board.**

- `setDashboard()` sets `body.dashboard`, which hides the page and everything on it by `visibility` (not `display`: the widgets are inside the list and must stay rendered), locks its scroll, shows the tab, and lets a floating widget's fullscreen take the whole viewport.
- Every map the layout does not place comes on down a cascade (`popoutRest()`): `CASCADE_STEP` apart from the top left of the viewport, back to the top once the widget in hand would run off the bottom, each round half a widget further right. The step is the cascade's own running count; worked out per widget from its height, it would be a different modulus for every height and land several widgets on one place. A map added to the list in the dialog arrives the same way.
- A board has no snap columns, since a column is a strip the page makes room for. No drag targets one there, and `sanitizeSnapLayout()` drops `left`/`right` from a board layout, so panes ticked onto a board come back as widgets among the rest.
- `popoutMaxWidth()` lifts `POPOUT_MAX_WIDTH` (the list's width): a board of half-width tiles on a wide screen needs more than 875.
- `[=]` is `[x]` (`setPopoutButton()` reads the mode) and takes the map off the list (`removeFromDashboard()`): the widget docked, its entry removed from the hidden list, and the list stored without it (`removeMapFromList()`), so no other map is drawn again and no frame reloads. The tab's `[+]` is the way back on (`addToDashboard()`): the map is stored on the end of the list, its entry appended as the render would lay it, wired alone (`wireDuplicate()`), and brought on at the cascade's first step.
- Leaving is by unticking the mode, or by docking everything (`dockAllPopouts()` drops the mode first, for the scrollbar), which *Vrati sve* and the breakpoint do.

**The cloak.** None of that can run until the maps are rendered, and by then the browser has usually painted what it had, so a board opened over a slow connection would show the ordinary page for a moment first. `cloakBoard()` prevents it: whether a board is coming is known from storage or `?v=` while `<head>` is still being parsed, and `html.board-boot` hides the page from then until the arrangement is applied. It comes off (`uncloakBoard()`) in a step of its own, so a throw in the apply cannot leave the page hidden. (In dev the scripts are deferred, so the cloak comes after the body is parsed and the flash can still show; the build inlines them into `<head>`, where this works.)

### The grid

The board can be worked on graph paper: `GRID_CELL` (16px) gives the lines, as a *size* rather than a count, so they fall on whole pixels whatever the window, the cells stay square, and the paper is one `repeating-linear-gradient` (`.po-grid`, fixed, hung off `body` rather than the `.container` the board hides).

- *Prikaži mrežu* draws it.
- *Poravnaj uz mrežu* settles a widget onto it, on release only (`snapToGrid()`, off the end of a drag, a resize and a group resize). Each edge goes to its nearest line (`gridLines()`: the multiples of the cell and the viewport's far edge), so the widget grows or shrinks to fit, held to its minimum by taking the next line out. A locked widget is freed first, since its height could never reach a line of its own. Two edges within half a cell of each other land on one line, which is what makes a snapped board exact where a placed one is only nearly so.
- Both switches work on the tick rather than on *Primijeni* (they are a way of working, not part of the view), are stored per browser (`mapGrid`), and mean nothing off the board: the dialog's are greyed there, the tab's hidden, and `G`/`S` quiet. `setGridPrefs()` announces `grid-changed`, which the tab's glyphs and an open dialog follow.

### Arranging the board

`arrangeBoard()` (*Posloži*, `[A]`, `A`) tiles every widget the same size, edge to edge, over the whole board: no gutter and no gaps, which is what a board left running wants, and what makes every inside edge a seam.

- **Freed.** "The same size" and "the shape its image has" cannot both hold: given one width, locked widgets come out at as many heights as there are maps. So the widgets are freed and letterbox their maps; the title bar's double-click takes a map back to its own shape. A frame is free already and fills its box.
- **Shape.** `arrangeShape()` picks the columns and rows that show each map biggest, not `ceil(sqrt(n))`: a map is contained in what its cell leaves under the title bar, so its size is the cell's area only when the cell has the map's shape (`arrangeAspect()`, `4/3` with nothing to measure), and a cell too wide or too tall is spent on ground. An empty cell costs `ARRANGE_HOLE` (1%), a tie-breaker only: it keeps nine a tidy 3×3 rather than a 4×3 whose maps come out the same size, and is too little to hold ten in thin strips. On a 16:9 screen with 4:3 maps: 2×1 for two, 2×2 for four, 3×2 for five and six, 3×3 for nine, 4×3 for ten to twelve; square maps lean wider (ten go 5×2).
- **Aspect.** `arrangeAspect()` averages `mapAspect()`: an image's or video's natural shape, else a locked widget's rect less the bar. A freed widget's rect is never read, since after an arrangement it is the cell that arrangement cut, and a freed frame has no shape and is left out.
- **Pixels.** `shareOut()` hands out whole pixels, the remainder over the first cells: a fraction left on a cell leaves a hairline between two tiles, which is exactly the difference between a seam and not.
- **Entering a board** whose layout places nothing tiles it; where the layout places some, the rest cascade in beside them. That tiling is the one thing `applySnapLayout()` writes back, since it was decided there.

### Seams

Two widgets edge to edge, the shared edge running the whole of both sides: `seamNeighbour()` finds it, and `resizeSeam()` moves it, one side giving what the other takes, the pair keeping its room and everything around it left standing. The check runs in the `pointerdown` handler ahead of `resizePopout()`, so an inside edge is a seam and an outside edge keeps what it meant.

- It also settles a press that was ambiguous: along a shared edge the two widgets' handles lie on top of each other, and which one took the press came down to which was raised last.
- A side handle only: a corner belongs to two edges and to however many widgets meet there. Whole edges only: a seam between sides of unequal length cannot move without tearing one of them off its other neighbours. Two candidates on one edge is no seam either.
- Both sides are freed first (a locked widget's height follows its width, so the seam would come apart under the gesture), and the travel is clamped so neither side goes under its minimum.
- `SEAM_ALIGN` is `GROUP_TOUCH`, one pixel: enough for what four-decimal fractions leave on a restored board.
- The seam has the same `MAGNET` as a single edge, onto the like edges of the other widgets, and on release both sides go through `snapToGrid()`, landing on one line together.
- **Ctrl (⌘ on a Mac) at the press** pulls one side alone, through the ordinary `resizePopout()`: the widget whose side of the edge the pointer is on. The key is read at the press only; switching which widget moves mid-pull would make no sense.

### Auto-refresh

A clock that re-fetches what `[R]` does, off until asked for, the interval one of `REFRESH_CHOICES` (5 minutes to begin with). It is a way of working, not part of the view, so it is stored per browser (`mapRefresh`) and travels in neither a preset nor a link.

- **What.** `reloadableBlocks()`: every `.map-block` holding an image, a video or a basic frame, docked or popped out. The rule is read off the map's type, not off the `[R]` button, which only a widget's bar carries; a docked map goes stale just the same. An interactive map is left out, being live already.
- **When.** The countdown runs off a deadline, not a number stepped down: a background tab throttles its timers to about one a minute, and a counter would lose exactly the time the page spent unattended, which is the page this is for. A manual refresh of everything restarts it (`restartRefresh()`), so the interval runs from the last time the maps were new; a load starts it full.
- **Where it shows.** The dialog's row (which writes its own label as it is built, not being in the document yet for the tick to find) and a countdown in the tab's cluster, both following `refresh-tick`.

### Keyboard and the title bar's gestures

Keys are for what the buttons cannot do in one gesture, and for backing out of what covers the screen. The letters name the thing, not a word for it, so they stand whatever language the page comes to speak.

| Key | What | Where |
|---|---|---|
| `K` | the settings dialog (*Karte*) | customize page |
| `H` | the manual (*help*; not `?`, which takes Shift on one layout and AltGr on another) | both pages |
| `Enter` | *Primijeni* while the picker is up | the dialog |
| `Escape` | shuts the dialog, else ends a fullscreen map | both pages |
| `R` | reloads every map with something to re-fetch | desktop |
| `G`, `S` | the grid and its snap | the board |
| `A` | arranges | the board, dialog shut |
| `D` | copies the widget on top | desktop, dialog shut |
| arrows | nudge the widget on top a grid cell (a pixel with Shift) | desktop, dialog shut |

- All keys are commands (`page/commands.js`), behind one guard: never from a text field, whose own keys come first, and never under a modifier, which belongs to the browser.
- The dialog keeps Escape while it is open; under a fullscreen map Escape does nothing else, since backing out is not a reason to take an arrangement apart.
- None of it reaches the page while an iframe has the focus: a press inside a frame belongs to the frame's document, so a click on the page or a title bar comes first, as for the pointer.
- **The widget on top** (`topPopout()`) needs no mark of its own: the order and the shadows show it, and a click on another picks another. A pane is out of it, and so is a widget hosting a fullscreen map. The step is one `GRID_CELL`, so a snapped board stays snapped; a group moves whole. The arrangement is written on a 300ms timer (`nudgePersist()`), since a held arrow repeats.
- **While the dialog is open** the arrows are its own (its body scrolls), and so are `A` and `D`. `G` and `S` still work, the dialog following them on `grid-changed`.

**The title bar** carries two gestures beside the drag (`titleBarOf()`; a link or button on the bar is itself, and the title is a link to the source):

- a double-click puts the map in fullscreen and takes it out, through the bar's own `[ ]`, so the gate and the scroll lock go as with a press of it. It shares the element with the aspect lock's double-click and can never be the same widget: only an interactive map has a `[ ]`, and an interactive map is always free, never letterboxed;
- a middle click is the bar's `[=]`/`[x]` without aiming at two characters. The middle button raises the autoscroll cursor on press, so the `mousedown` is taken and the action left to `auxclick`.

Both are on the bar only: over a frame the page never sees them, and on an interactive map a double-click is already the gate's (*Dvostruki klik za pristup interaktivnoj karti*) and then the map's own zoom.

## Storage

| Key | What | Travels |
|---|---|---|
| `mapPrefs` | the customize page's view, with its `layout` | in a share link, as `?v=` |
| `mapUserPresets` | saved presets, each with its `layout` | a preset's row shares it |
| `mapHiddenPresets` | built-ins hidden from the preset bar | no |
| `mapConfig` | the last copy of the worker's `config.json` | no |
| `showLinksBottom` | the links under each map | no |
| `mapGrid` | the board's grid switches | no |
| `mapRefresh` | auto-refresh | no |
| `msTab` | where the tab was put | no |
| `msPanel`, `manualPanel` | where and how big each dialog was put | no |

Every key is named once, in `STORAGE_KEYS` (`lib/storage.js`), and every read and write goes through `readJson()`/`writeJson()`/`removeKey()`, which never throw. With storage refused or full, a write is kept for the session and read back from there, so the view still works (a private window, a blocked site). Everything read back from storage or `?v=` passes a guard (`isValidPrefs`, `isValidPreset`, the filter on hidden presets, `sanitizeSnapLayout`): an unknown preset id is rejected rather than kept.

`?debug=1` on any page turns on console logging (`dlog()`, `lib/debug.js`).

## Touch notes

Details worth keeping in mind when touching the drag and scroll code:

- the drag handle must not be `display: inline`: `touch-action` is ignored on non-replaced inline elements, so touches would scroll the page instead of dragging;
- pointer capture cannot be used for the picker's row drag: touch pointers implicitly capture the handle, and any capture breaks once the row is moved in the DOM (`insertBefore`). The implicit capture is released on `pointerdown`, and the move and up listeners live on `document`;
- `scrollIntoView` scrolls *all* ancestors, so it cannot reveal something inside a dialog: it drags the page up to the dialog too. The preset bar wraps its chips for this reason, growing in the axis the dialog already scrolls, and a heading link in the manual scrolls `.ms-body` by hand.

## The manual

[`MANUAL.md`](./MANUAL.md) is the user-facing document: what the site does and how to work it, in Croatian, which is what the site speaks. It sits at the root beside `README.md` and this file (*what it is*, *how to use it*, *how it works*), and cannot live in `docs/`, the conventional place, because `docs/` is the build output and the build deletes it on every run. The file name is English like the rest of the repo, leaving room for a `MANUAL.en.md` beside it.

It shares no prose with this file on purpose: this one explains mechanism to someone reading the code; that one answers *how do I keep two radars side by side while I scroll?* Every UI label it quotes is the label the code renders, so a label that changes is one search from the line that quotes it.

### The manual on the site

The Markdown is the only source, and the build makes HTML of it ([`scripts/manual.mjs`](./scripts/manual.mjs), which takes `MANUAL.md` and returns the fragment's lines). The built pages get it inlined at `<!-- manual -->`; the build also writes it to `src/_components/manual.c.html`, which the dev pages fetch through `include.js` (the `data-include-html` on the dialog's `.ms-body`, stripped from the built pages). That file is build output and git-ignored, so a page served from `src/` shows the manual as of the last build.

It is shown in a dialog rather than on a page of its own, so it can be read beside the maps it describes. Both pages carry it (`#manualDialog`, with the same `.ms-home` in its head as the settings dialog, written as `href="/"` for the build to rewrite), reached by the `?` button, the footer's *Upute* or `H`. A dialog has no address, so `#upute` stands in: it opens the dialog on arrival, and the dialog writes it and takes it away again through `replaceState` (assigning `location.hash` would stack a history entry per open).

**The converter** handles a fixed subset (`##`/`###` with slug ids, paragraphs, `-` lists, tables, blockquotes, `**bold**`, `*italic*`, `` `code` ``, `[text](#anchor)` and `<kbd>`) and throws on anything it does not recognise, naming the line, so the manual cannot silently render wrong. `# ` is recognised and dropped, the dialog's head carrying the title.

- Order is the whole of the inline pass: code spans are lifted out to placeholders first, since the document writes glyphs inside them (`[R]`, `❮`, `×`) that the rest would reach into; bold is matched before italic, or `**` reads as an empty emphasis.
- `&`, `<` and `>` are escaped throughout and `<kbd>` alone is put back, which makes it an allowlist: anything still reading as a tag afterwards throws. Leftover `*` or `](` after the pass throws too, so unbalanced markup is caught rather than shipped.
- Slugs are GitHub's, since the document links to its own headings and those anchors must resolve in both places: lowercased, punctuation dropped, spaces to hyphens, every letter kept whatever its alphabet (`#nadzorna-ploča` keeps its diacritic).
- A heading link inside the dialog is intercepted and scrolls `.ms-body` by the offset between the two rects (see *Touch notes*).

Rendering it client-side from the raw `.md` was considered and rejected: it needs a Markdown library or a hand-rolled parser in the page, against the no-dependency grain, and leaves the dialog empty without JavaScript.

In the build, the injection comes before the path rewrites, so a `/customize/` link the manual grows later is rewritten like any other; the comment strip comes after it, so the converter emits no comments; and the fragment's lines are joined with CRLF, which the indentation splits on (see *Build*).
