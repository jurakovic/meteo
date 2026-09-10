
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

`DEFAULT_MAPS` holds the default order (mirroring the landing page); `MAP_PRESETS` lists the built-in presets, each carrying its own `maps` id list so resolving one is a plain lookup (`zadano` is the default set — displayed as *Osnovno*, but the id stays `zadano` because it is written into saved preferences and shared links; `vise` is the former extras set, `sve` the whole catalog, `nista` none). The "Karte" button opens a settings panel with two sections: the selected maps on top (this *is* the render order — drag the `≡` handle to reorder) and the available maps below (a finding surface only, sortable by name or category without affecting the render order; checking a map appends it to the selected block). Changing the selection or order auto-selects *Prilagođeno*, and dots the chip the list came from (`.ms-chip.ms-origin`, a `::before` at the left edge, clear of the corner triangle a saved preset carries at the same time) so the bar still names the view the edits are a copy of. Clicking the dotted chip reloads that preset and drops the edits — no extra handler: *Prilagođeno* holds the selection, so the origin chip is the unchecked one and its `change` fires normally. The selection deliberately does **not** stay on the origin chip: what a share link can carry for an edited preset is a bare list, not a name (a modified *Osnovno* is not `zadano`, and shipping `name: "Osnovno"` would plant a preset of that name holding different maps), so the flip to *Prilagođeno* is what tells you before *Podijeli* that a list travels. *Primijeni* saves to localStorage as `mapPrefs` (`{"preset":"radari"}` or `{"preset":"custom","maps":[…]}`), re-renders, and calls `initDynamicContent()` in `main.js` to wire the fresh DOM (lazy images, swipe, iframe src, overlays, link shadows, progress bar).

#### Saved presets

Below the picker sits the management list — *Zadani predlošci* first, then *Moji predlošci*, the order the preset bar puts them in — where the current selection can be saved under a name (`mapUserPresets`), then renamed, shared or deleted. Saved presets take the same `{ id, name, maps }` shape as the built-ins and are appended to them by `allPresets()`, so the preset bar, `presetMapIds()` and the stored preferences treat both alike. Their ids are prefixed `u:` to keep them out of the built-in namespace, which leaves the name free to change — renaming never breaks a saved preference. Saving under an existing name overwrites that preset, so the name is the handle: it is trimmed, collapsed and capped at `PRESET_NAME_MAX`. In the preset bar, saved presets carry a corner triangle (`.ms-chip.ms-user`, a `::after` so it costs no layout in chips that stretch and centre their names) — the same split the two management headings draw.

Amending a saved view has a direct path too: pick its chip, edit the list, and its row's *Podijeli* becomes an *Ažuriraj* link writing what is on screen over it. Both paths end in `storeUserPreset()` keyed by name, so preset contents have one write path, and the id survives — preferences and links naming that preset follow the change. The link hangs off `editingPresetId`, the preset the list was *loaded from*, not the bar selection, which editing flips to *Prilagođeno* (`markCustom()` re-renders the management list and re-marks the bar, so both marks track the edits). It shows only while the on-screen list differs from what is stored, and only on that row: an unrelated list must never overwrite a preset. `editingPresetId` holds built-in ids too, since they carry the origin dot — so the `isUserPresetId()` guard in `hasPendingEdits()` is load-bearing, not decorative: a built-in reaching `storeUserPreset()` would fork a saved copy of itself under its own name instead of updating anything. Note the build order it imposes — `fillList()` runs before `renderPresets()`, which reads the picker back to place the dot and would read an empty one as edited away from every preset. It replaces *Podijeli* rather than taking a fourth slot: three action columns are what fits a phone row beside the name, and a fourth drops every row's actions — built-ins included, since the slots only read as columns if all rows carry the same ones — onto a second line. Sharing is the one to give up while a row holds unsaved edits, since the row's link shares the preset *as saved* and the panel's own *Podijeli* covers the list on screen; it returns as soon as the edits are saved or dropped. Anything added here later has to replace a slot too, not join them. Like the rest of the panel it saves the preset only — the page still needs *Primijeni*.

Built-ins cannot be deleted (they are code) but can be hidden from the preset bar (`mapHiddenPresets`). Hiding is a **display choice only** — `allPresets()` keeps returning them, so a saved preference, the `zadano` fallback and a shared link naming a preset the recipient hides all still resolve; only `visiblePresets()` filters. `zadano` is exempt (`PERMANENT_PRESET_ID`) so the bar can never come down to *Prilagođeno* alone.

Deleting is the one panel action that writes to storage without *Primijeni*, so `deleteUserPreset()` also rewrites a `mapPrefs` naming the deleted preset into a `custom` snapshot of its maps — otherwise it would fail `isValidPrefs()` on the next load and silently fall back to *Osnovno*.

#### Share links

*Podijeli* copies a link with the current panel state URL-safe-base64 encoded in `?v=`. On load the parameter overrides saved preferences **for the session only** — it never writes to the recipient's localStorage. The parameter stays in the address bar (refresh-safe, re-copyable) and is removed via `history.replaceState` when the user applies their own settings. Clipboard API needs a secure context (https/localhost); elsewhere a prompt with the link is shown.

A built-in preset travels as its id, which every visitor resolves. A saved preset's id means nothing to a recipient, so it travels as its contents plus its name (`preset: 'custom'` + `maps` + `name`); the panel then offers to save it under that name, de-duplicated against the recipient's own presets so nothing of theirs is overwritten.

Arriving without an id, such a link would always open on *Prilagođeno* — including your own, where the list is a preset you already have. `activePresetId()` matches it back with `presetIdForMapIds()`: contents and order only (the name is a label the recipient may have used for something else, and a renamed preset is still the same view), saved presets searched before built-ins so a saved copy of a built-in list selects the copy. Matching also drops the offer to save it, which would only add a suffixed duplicate. Only the session-only shared view is matched this way — a `custom` in stored `mapPrefs` is a list the user chose not to save, and binding it to a preset id would hand later edits of that preset to a view that merely matches today.

Note when extending the payload: `btoa()` rejects code points above U+00FF, and the name is user-typed — every Croatian diacritic (č ć š ž đ) is above it. `encodeMapView()` escapes non-ASCII to `\uXXXX` before encoding, which keeps the input ASCII and needs no counterpart in `decodeMapView()`, since `JSON.parse` reads those escapes back on its own.

#### Pop-out widgets

On desktop every title bar carries a `[^]` button that lifts the map out of the table into a fixed, draggable, resizable widget, so one or more maps stay visible while the rest of the page scrolls. `renderMaps()` wraps each map's nodes (title bar, map, indicators) in one `.map-block` so there is a single element to lift; the links row below stays in the table. The button sits in the map-level title bar, or on each slide's title bar for titled slideshows without one (`buildTitleBar()`'s third argument).

Like the iframe fullscreen it is class-and-inline-style only — nothing moves in the DOM, which would reload an iframe. `popoutMap()` adds `.popout` (`position: fixed`), sets an inline `width` (`POPOUT_WIDTH`, or narrower if the block already was) and `left`/`top` at the block's on-screen position, so it reads as lifted rather than teleported, and drops a `.map-gap` spacer of the block's height after it, so the table does not jump; the spacer's *Vrati* and the button (now `[=]`) both call `dockMap()`, which removes the classes, the handles, the spacer and every inline property.

Resizing works from any side or corner through eight `.po-h` handles appended on pop-out, thin strips and corner squares straddling the edge. Two kinds of widget: images, slideshows and videos are *locked* — their height follows the width (`aspect-ratio`, `.vid1` padding), so `resizePopout()` only ever writes `width`, turns a pull on the top or bottom edge into the width that gives that height (via the start ratio, an approximation the title bar's fixed height makes slightly nonlinear), and lets a corner follow whichever axis asks for more. Iframes have no aspect of their own, so their widgets are *free* (`isFreePopout()`, `.free`): the block carries an inline `height` too, starting from what the `.if1`/`.if2` padding gave it at pop-out width, and lays out as a column in which the map takes what the title bar leaves. Pulling the left or top edge keeps the opposite edge in place by moving the widget along; the new top is computed from the laid-out `offsetHeight`, so it is exact for locked widgets as well. Dragging is a `pointerdown` on a non-fullscreen `.radartitle` inside a `.popout` (links and buttons excluded); both gestures share `trackPopoutPointer()`, move/up listeners on `document`. `preventDefault()` on the `pointerdown` also suppresses the compatibility `mousedown`, so a drag by a slide title bar cannot register as a swipe on the slideshow around it, and `body.po-dragging` turns iframe pointer events off so the pointer is not swallowed mid-gesture. Any `pointerdown` on a widget raises it (`popoutZ`) — except one hosting a fullscreen map, which is kept under the others (see below). `placePopout()` clamps into the viewport, on drag and on window resize alike. Away from the viewport edges the other floating widgets are magnets (`magnetPosition()`, within `MAGNET`): an edge brought close to another widget's opposite edge is pulled onto it — beside it when the two overlap in height, above or below it when they overlap in width — and once they meet on one axis the nearer of the like edges lines up on the other, so a widget dropped below another sits flush with its side. The closest edge wins per axis; the others' rects are read once at the start of the drag (`magnetRects()`, panes and fullscreen hosts left out), and the pull only starts past `SNAP_ARM`, like the column snap, so a click does not move a parked widget. A drag never changes a size — the widget is moved onto an edge, not fitted to it — but a resize has the same magnets on the edge being pulled (`magnetEdge()`): it lands on the facing edge of a widget beside it (above or below it, for a top or bottom edge) or in line with the like edge of a widget above or below it, exact for a width and through the aspect ratio for a locked widget's height.

Widgets that touch — an edge of one on an edge of the other, overlapping along it (`rectsTouch()`, within `GROUP_TOUCH`), which is what the magnets leave — can be *grouped*, explicitly only: the title bar's `[+]` (`.grp-btn`, first in the cluster, shown by `updateGroups()` only on a widget touching another or in a group; `[-]` on a member) joins the widget with what it touches, and with their groups, into one (`joinGroup()`), and `[-]` takes it out (`leaveGroup()`; a group left with one member is dissolved, and a group whose middle leaves stays a group though its ends no longer touch). Widgets touch only in one place — floating over the page, or panes of the same column (`touchingBlocks()` looks no further) — so a group is always in one place. A group lives in `block._group`, an id shared by its members, and shows as `.grouped` (the frame in the snap blue, and no shadow, which would fall across the member under it). It drags as one: `dragPopout()` moves the members by one offset (`groupStarts()`/`moveGroup()`, or `movePanes()` in a column), with the magnets, the viewport clamp and the column snap seeing the group's bounding box (`groupBox()`) rather than the widget held; dropped at a viewport edge it goes into the column as a stack and stays a group, and pulled out of a column it floats as one. It raises as one too (`raisePopout()` brings the members up in their order), and the window-resize clamp moves a floating group by its box. Each member still resizes on its own, so a resize can open a gap the next drag's magnets close. Docking a member takes it out of its group. In the stored layout a group is a number shared by its members' entries (`group`, counted in order of appearance over the columns and the floating widgets; `sanitizeSnapLayout()` drops one left with a single member or spread over two places), mapped back to fresh ids on restore.

Desktop only: `POPOUT_MQ` (`min-width: 801px` plus `hover: hover` / `pointer: fine`) gates `popoutMap()` and, as the same media query in CSS, the button's visibility; shrinking below it docks every widget. Widgets are session state — *Primijeni* re-renders the tbody and they go with it.

#### Snap columns

A widget dragged until its own edge reaches the left or right edge of the viewport (`SNAP_EDGE`, 5px, wherever the bar is held — the position the pointer asks for is checked, not the clamped one, so pushing on past the edge still counts; and only after `SNAP_ARM` of movement, so a click on a widget parked at the edge is a click) snaps into a column there: a strip of the viewport's height in which panes sit freely one above another, the page laid out in what is left between the columns (`body` padding through the `--snap-l`/`--snap-r` custom properties, so the table centres in the remaining width). Sizes come from `viewportWidth()`/`viewportHeight()`, the document's `clientWidth`/`clientHeight`: `innerWidth` counts the vertical scrollbar, under which a right column (and a floating widget clamped by `placePopout()`) would otherwise land. A pane is still a pop-out widget — same block, same classes, same fixed positioning, nothing moves in the DOM — only its width is the column's and its place comes from `layoutSnapColumns()` instead of a gesture. `snapColumns` holds per side a `width` and a list of `{ block, top, height? }` panes, every number a fraction of the viewport so a window resize keeps the proportions; a free pane carries its height, a locked one's follows the width. A pane's top is its own: up and down the column it is dragged as a widget is over the page, with the column's ends and the other panes' tops and bottoms as magnets (`paneMagnetEdges()`, `paneTop()`, which `movePanes()` applies to the dragged panes' box), and a free pane's top and bottom handles resize it against the same edges (the side and corner handles are hidden in a column by CSS, all of them on a locked pane). The drop is previewed by `.snap-preview` at the slot `snapSlot()` gives — the column's width (a new column takes the widget's own, clamped to what the other column leaves), the top the widget's box asks for pulled to the column's magnets, and the height the dropped widgets stack to at that width — and `snapPanes()` stacks them there in top-then-left order, each under the one before, so a group drops into a column as one and stays a group.

Two fixed elements per column: `.snap-col` paints the column's ground below the panes, `.snap-ui` above them holds the handle (`pointer-events: none` on the wrapper, `auto` on the strip) — the inner edge (`resizeSnapColumn()`, up to everything the other column leaves). A fullscreen map fills its container rather than the viewport: the CSS puts `.radartitle.fullscreen` and `.if1.fullscreen` between `--snap-l` and `--snap-r` (zero elsewhere, so the landing page and a page without columns are as before; `.if1`'s `width: 100%` has to be undone there or it beats `right`), and a pane's `.snapped-left`/`.snapped-right` class moves them over its column, which follows a column edge drag live; under `body.snap-full` a floating widget's fullscreen takes the whole viewport, since the page it would fill has none. `toggleFullscreen()` in `main.js` locks the page scroll only for a map not in a pane — beside a column-filling map the page stays in use — and both it and `exitFullscreen()` dispatch a `map-fullscreen` event, on which `maps.js` marks the widget hosting a fullscreen map `.fs-host` (only the bar and the map move to the fullscreen place; the widget's box — frame, shadow, handles — would stay behind, an empty frame over whatever it was floating on, so it goes `visibility: hidden` with the two fullscreen children visible again). The widgets floating over the page stay in view over a fullscreen map, whichever map it is: on desktop the CSS puts the fullscreen classes under the widgets' `z-index` range (`4500`, above the columns' ground), and since a widget's own fullscreen stacks inside the widget's context, the host is lowered to the same place (`POPOUT_FS_Z`, the `pointerdown` raise skipping it meanwhile) and raised again when the fullscreen ends — a fullscreen map never covers another widget, only the page or its column. The same handler has `layoutSnapColumns()` re-lay the columns out to a viewport the scroll lock's scrollbar toggle has just changed. The bar's `[=]` is hidden in fullscreen as before; the spacer's *Vrati* still docks such a pane, and `dockMap()` takes the fullscreen down first. A free (iframe) pane takes the column's width with the height it carries, through the inline height `.free` lays out; a locked one takes the column's width and the height its aspect gives at it, pulled in to what its content spans (`fitSnapPane()`, `snapContentWidth()`: the narrowest of the visible title bars, which carry the map's `maxWidth`, and images or videos, which stop at their natural width — otherwise the title bar and indicators would run on across a column wider than the image), and sits centred in the column; either is held inside the viewport by its top. A locked pane's height can change under the fit — a titled slideshow takes its width from the image and changes aspect with the slide — so a `load`, `click` or `pointerup` inside a locked pane lays the columns out again.

The columns can take the whole width — two meeting, or one at full width — which hides the page: `isSnapPageHidden()` reads it off the width fractions summing to one (so it does not depend on the pixel viewport, which changes at that very moment: `body.snap-full` drops the page's scrollbar, and `layoutSnapColumns()` toggles the class before measuring). An edge dragged within `SNAP_SHUT` of what the other column leaves snaps shut, and the width is then set to exactly `1 - other` so the state reads. Two columns that meet share one seam handle — the left column's edge with `.snap-seam`, the right one's hidden — that moves width between them (`resizeSnapSeam()`); a double-click on any edge hides the page (this column takes what the other leaves) or, when it is hidden, brings it back to the widths from before (`snapPageWidths`, kept by the drag or the click that hid it) — failing those, the columns are scaled down to leave the table's width. The browser's `dblclick` is used as is: the drag's `preventDefault()` on `pointerdown` leaves it alone, and the browser already tells a double-click from two drags apart.

Dragging a snapped pane's title bar moves it up and down its column until the drag goes `SNAP_DETACH` sideways, then `unsnapPane()` floats it again as it stood — size and place kept, the title bar under the pointer — and it can be dropped straight back into the column, or the other one. `dockMap()` unsnaps first, so the `[=]` button, the spacer's *Vrati* and the breakpoint work on panes as on widgets; `renderMaps()` calls `resetSnapColumns()` since the panes go with the tbody.

#### Remembered and shared layouts

The arrangement is part of the view, so it travels with the map list rather than as a thing of its own: `snapLayout()` serialises the columns (per side the width and the panes as map ids with their height shares) and the widgets floating over the page (`floating`, bottom to top so they stack the same way again: id, left, top, width, and a height for a free one — a locked widget's height follows its width), every number a fraction of the viewport rounded to four places, null when nothing is popped out — and it sits as `layout` next to the list in `mapPrefs`, in a saved preset (`{ id, name, maps, layout }`) and in the `?v=` payload. It is always a subset of the list it sits beside, and `sanitizeSnapLayout(layout, mapIds)` holds every copy read back to that — storage, links, saved entries: a pane or a floating widget must name a map in the list, once across all of them, panes up to the cap; shares are renormalised, the widths bounded to the viewport, a bad width drops its column, a floating entry with a number out of range is dropped, and a map dropped from the list leaves the layout. `applySnapLayout()` rebuilds it all from a clean layout after a render (each pane popped out and attached as it stands through `attachSnapPane()`, then widths and shares set as stored; each floating widget popped out, sized within the widget limits, placed and raised in order), with persistence paused, since what is being applied is what is stored; on load, `applyStoredSnapLayout()` does this on `DOMContentLoaded`, registered after the render so the maps are there — and after `main.js` has run in dev, since the snap code logs through `dlog()`. Desktop only, like the gestures: a phone carries the layout and does not show it.

The arrangement is written as it changes (`persistSnapLayout()` at the end of every pop-out and dock, drag and resize, snap, handle drag and page toggle — `unsnapPane()` itself leaves it to its callers, which end in a state of their own) — it is direct manipulation, not a form with an apply button — into `mapPrefs` next to whatever list is there. Under a shared view it goes into `sharedMapView` and back into the address bar instead, so the link stays re-copyable with the arrangement as it is now and a refresh keeps it, while the recipient's storage is still never written. The breakpoint docking everything runs with persistence paused (`snapPersistPaused`): that is the window changing, not the arrangement, and the stored layout is kept for a desktop window.

*Primijeni* decides which arrangement the new list gets (`layoutForPrefs()`): a preset is a whole view, so a saved one brings its own — none, if it was saved with nothing popped out — and a built-in, which has none, docks everything; only the custom list keeps the one on screen, as far as its maps allow, since that is an edit of the current view rather than a switch to another one; it goes into the preferences with the list and `applySnapLayout()` brings it back after the render drops the panes. Saving a preset (*Spremi*, *Ažuriraj*) stores the arrangement on screen held to the list in the picker (`selectedLayout()`), and `hasPendingEdits()` counts a changed arrangement as an edit, so a rearranged page offers *Ažuriraj* on the preset it was loaded from — only there, though: the origin dot on the chip marks a changed list, which is what the panel itself edits. Sharing carries it the same way: the panel's *Podijeli* with the list on screen, a saved preset's row with the preset's own (`presetSharePrefs()`), and a recipient who saves the shared view keeps it. The panel's one sign of all this is the `.ms-layout` line naming what is popped out (*Izdvojene karte: lijevo 2, desno 1, u prozoru 1*) with *Vrati sve* to dock it all. The panel is rebuilt on every open, but the arrangement changes behind it while it is open — a map popped out, a pane snapped — so `persistSnapLayout()` calls the open panel's `_onLayoutChange()`, which redraws the line and the management rows, and *Ažuriraj* appears or withdraws at once.

#### Misc

- `?debug=1` on any page enables console logging via `dlog()` in `main.js`
- localStorage keys: `mapPrefs` (customize page view, with the snapped `layout`), `mapUserPresets` (saved presets, each with its `layout`), `mapHiddenPresets` (built-ins hidden from the preset bar), `showLinksBottom` (links-under-maps toggle). Everything read back from storage or from `?v=` passes a guard (`isValidPrefs`, `isValidPreset`, the filter in `loadHiddenPresets`) — an unknown preset id is rejected rather than kept, and every write is wrapped so disabled or full storage still leaves the view working for the session

#### Touch notes

Hard-won details worth keeping in mind when touching the drag/scroll code:

- the drag handle must not be `display: inline` — `touch-action` is ignored on non-replaced inline elements, so touches would scroll the page instead of dragging
- pointer capture cannot be used for the drag: touch pointers implicitly capture the handle, and any capture breaks once the row is moved in the DOM (`insertBefore`). The implicit capture is released on `pointerdown` and move/up listeners live on `document` instead
- `scrollIntoView` scrolls *all* ancestors, so it cannot be used to reveal something inside the panel — it drags the page back up to the panel too. The preset bar used to scroll horizontally and needed a hand-rolled reveal for this reason; it now wraps its options as chips instead, growing in the axis the page already scrolls, and the reveal is gone
