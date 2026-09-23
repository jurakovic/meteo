# Refactoring plan

Architecture review of the site's code (mainly `src/_assets/js`) and the work that follows from it. Each step is verified (lint, tests, a browser pass, a full build), committed and pushed on its own. The status column is kept up to date as the work goes.

Status: ⬜ todo · 🔄 in progress · ✅ done

## Findings

| # | Finding | Where | Addressed in |
|---|---|---|---|
| F1 | **No modules.** Every function is a global shared by three files; load order matters (`typeof X === 'function'` guards, "uses el() from maps.js at call time only"); `maps.js` and `popout.js` depend on each other both ways; inline `onclick` in HTML relies on globals | all JS, HTML | S4 |
| F2 | **Files and functions that do too much (SRP).** `popout.js` (2,793 lines, 151 functions) holds widgets, copies, dashboard, grid, tiling, shadows, groups, seams, resize, keyboard, auto-refresh, snap columns and layout persistence; `buildMapSettings` is one ~866-line closure | `popout.js`, `maps.js` | S5 |
| F3 | **Scattered state, some of it in the DOM.** ~15 mutable top-level variables; expando properties (`block._group`, `_gap`, `_shadow`, `if1._fsOverlayVisible`, `panel._on*`); state read from a button's label (`textContent === '[R]'`); a global `snapPersistPaused` flag set and reset in five places with no `try/finally` (a throw leaves persistence off for the session) | `popout.js`, `maps.js`, `main.js` | S2, S7, S10 |
| F4 | **Three ways of notifying.** Custom events, callbacks stored on the panel element and direct cross-file calls; functions with hidden side effects (`persistSnapLayout` also recomputes groups/overlap/dialog, `updateCovered` also refits fullscreen and shadows) | `popout.js`, `maps.js` | S7 |
| F5 | **Duplication.** `clamp`/`dialogClamp`, `roundFraction`/`dialogFraction`, `viewportWidth`/`dialogViewportWidth`, `trackPopoutPointer`/`trackDialogPointer`, two identical media queries, two handle lists; the text-field keyboard guard ×5; ten localStorage keys each with its own try/catch; `MAP_CATALOG.find` ×9; `removeMapFromList`/`addMapToList`; `addToDashboard` repeats `renderMaps`; the 800/801 px breakpoint in JS and CSS | all JS, CSS | S2, S6 |
| F6 | **Two sources of truth for the catalog.** The landing page is ~16 maps written out by hand next to `MAP_CATALOG` | `src/index.html`, `maps.js` | S11 |
| F7 | **Map types are not open for extension.** Knowledge of a type is spread over `buildMapContent`, `isFreePopout`, `hasFullscreen`, `reloadableBlocks`, `reloadMap`, `mapAspect` | `maps.js`, `popout.js` | S9 |
| F8 | **Keyboard and actions.** Five document `keydown` listeners in three files, Escape handled twice by convention; reload/grid/snap/arrange/duplicate each exist as a button, a tab glyph and a key | all JS | S8 |
| F9 | **Dead code and hard-coded switches.** `GetLastInit`, `DTGFromDateInHours`, `EndValue`, `pad`; commented-out catalog entries; `MANUAL_ENABLED` in code; `resetIframePosition` wrapper; `document.write` in the meteogram page | `main.js`, `maps.js`, `meteogram` | S2 |
| F10 | **Comments and docs hard to scan.** ~29% of `popout.js` is narrative comments, partly history; `INTERNALS.md` is 109 KB with lines up to 13k characters | JS, `INTERNALS.md` | S13 |
| F11 | **No tooling.** No `package.json`, linter, tests or type checking; minified files made by hand in Docker; the build needs Windows PowerShell and `unix2dos` | build | S0, S1, S3 |
| F12 | **HTML/CSS.** Table layout with deprecated attributes, inline handlers and styles; no CSS custom properties (`#485871` ×20, `#ff9800` ×12); z-index values spread across CSS (1…100001) and JS (5000, 4500) | HTML, CSS | S12 |

## Bugs found on the way

| # | Bug | Found by | Fixed in |
|---|---|---|---|
| B1 | Narrowing the window below the breakpoint reads the arrangement kept for the wide window *after* the viewport has narrowed, so fractions are taken against the narrow width and widgets come back displaced when the window widens again (the stored preferences are right; only the same session is off) | `widgets.spec.js`, "a narrow window…" | S2 |
| B2 | The find box's comment says "cesk" finds ČHMÚ; it does not (the name folds to "chmu") — a stale comment | `dialog.spec.js` | S2 |

## Steps

| Step | What | Findings | Status |
|---|---|---|---|
| S0 | This plan; the build runs on Linux as well as Windows and reproduces the committed `docs/` byte for byte | F11 | ✅ |
| S1 | Browser test suite (Playwright) over the current behaviour, with the external images and the worker served locally so it runs offline | F11 | ✅ |
| S2 | Quick wins: dead code out, `withPersistPaused` (try/finally), in-file duplication (list storing, table rows, catalog lookups); bugs B1–B2 | F3, F5, F9 | ✅ |
| S3 | `package.json`, ESLint, unit test runner; the build ported to Node (minify + assemble + manual), producing the same `docs/` | F11 | ⬜ |
| S4 | ES modules, bundled per page with esbuild; no globals, no load-order guards, no inline `onclick`; the helpers duplicated across files (`clamp`, viewport, pointer tracking, media query, handles, keyboard guard) merged into shared modules | F1, F5 | ⬜ |
| S5 | `maps.js` and `popout.js` split by responsibility; `buildMapSettings` split into parts | F2 | ⬜ |
| S6 | Shared infrastructure: one storage module for all localStorage keys, a catalog index, shared geometry/DOM helpers | F5 | ⬜ |
| S7 | One state store and an event bus; `panel._on*` callbacks and cross-module pokes replaced by subscriptions; side effects taken out of `persistSnapLayout`/`updateCovered` | F3, F4 | ⬜ |
| S8 | Command registry: one table of actions used by buttons, tab glyphs and one keyboard listener | F8 | ⬜ |
| S9 | Map-type registry (Strategy): build, reload, free/fixed aspect, fullscreen, aspect per type | F7 | ⬜ |
| S10 | Iframe gate/reset as explicit state; per-element state in `WeakMap`s instead of expando properties | F3 | ⬜ |
| S11 | Landing page generated from the catalog at build time | F6 | ⬜ |
| S12 | CSS custom properties (colours, z-index layers shared with JS); inline handlers/styles and deprecated attributes out of the HTML | F12 | ⬜ |
| S13 | Comments tightened with JSDoc types and `// @ts-check` type checking; `INTERNALS.md` rewritten for the new structure | F10 | ⬜ |
| S14 | Final review pass over the whole codebase | all | ⬜ |

## Log

- **S0** — `build.ps1` made path-agnostic (component filter, relative path, output path, `New-Item` instead of `mkdir -Force`). On Linux with PowerShell 7 the build of the unchanged source reproduces the committed `docs/` and minified files exactly.
- **S1** — `npm run test:e2e`: 58 Playwright tests (×2: the dev tree and the built site) over the landing page, the settings dialog, pop-out widgets, the dashboard, auto-refresh and a phone. `tests/serve.mjs` serves `src/` and `docs/` (under `/meteo/`), and `tests/e2e/fixtures.js` answers every outside request (images, frames, the worker's `config.json`), so the suite runs offline and fails on any script error. B1 is marked as an expected failure until it is fixed. Stable over three repeats.
- **S2** — Removed `GetLastInit`/`DTGFromDateInHours`/`EndValue`/`pad`, the `resetIframePosition` wrapper, the commented-out catalog entries (Meteociel's sandwich slides and Időkép's Adria radar — still in git history, e.g. `6f35625:src/_assets/js/maps.js`) and with them `videoClass` and `.vid2`. `withPersistPaused(fn)` replaces the five set/reset pairs of `snapPersistPaused` and restores the previous value in a `finally`; `applySnapLayout`'s placing part became `placeSnapLayout`. `storeShownList` replaces the twin bodies of `removeMapFromList`/`addMapToList`, `appendMapRows` the row building repeated in `renderMaps` and `addToDashboard`, and `catalogMap(id)` (a `Map` index) the nine `MAP_CATALOG.find` scans. The meteogram page builds its frame with DOM calls instead of `document.write`. **B1** fixed: the arrangement kept at the breakpoint is the stored one, not one read off the already-narrowed screen. **B2** fixed. The helpers duplicated *across* files wait for S4: without modules, sharing them would need yet another global script and load-order care — which the first attempt here ran into (`maps.js` renders before `main.js` is loaded in dev).
