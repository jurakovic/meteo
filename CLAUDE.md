# CLAUDE.md

A static weather-maps site: vanilla HTML, CSS and ES modules, no framework and no runtime dependencies. How it works, the module map and the commands are in [`INTERNALS.md`](./INTERNALS.md); read the section for the area you touch before changing it. What visitors see and how they use it is in [`MANUAL.md`](./MANUAL.md).

## Layout

```
src/                  the site (served as is in dev)
  index.html          landing page
  customize/          the customize page: picker, widgets, board
  meteogram/          the frame the worker screenshots
  extras/             redirect stub for old bookmarks
  _assets/js/         ES modules (lib/, page/, maps/, settings/, widgets/; see INTERNALS.md, Code map)
  _assets/css/styles.css   the one stylesheet
  _components/*.c.html     fragments the build injects
docs/                 build output, committed, published by GitHub Pages
scripts/              build.mjs, manual.mjs
tests/e2e/            Playwright, offline through fixtures.js
tests/unit/           node --test, DOM stub in setup.mjs
INTERNALS.md          how it works (the one place for that)
MANUAL.md             user manual, Croatian, built into the pages
```

## Working rules

- **Finish with `npm run check`.** A behaviour change also runs `npm run build` and commits the rebuilt `docs/` with the source, as past commits do.
- **The e2e suite reuses whatever listens on port 8080.** An nginx container serving `src/` there (INTERNALS.md, Run from src) fails every `built` test with 404s. Stop it, or run the suite on a config with another port.
- **A bug fix comes with a test** that fails without the fix. Prove it by running the test against the unfixed code.
- **Keep INTERNALS.md true.** When behaviour changes, update its section in the same change. A paragraph that no longer matches the code is a bug. The history of a change belongs in its commit message, not in a doc in the repo.

## Files

Line endings are CRLF except `*.md` and `*.sh` (LF); indentation is tabs (`.editorconfig`). `sed -i` and most rewriting scripts turn a whole CRLF file into LF, so edit with the editor tool, or convert back and check with `file` before committing.

## Comments

INTERNALS.md explains how a feature works; a code comment explains the code it sits on. They do not repeat each other.

- **A module header** is one to three lines: what the module is, then a pointer to its section, `See INTERNALS.md, Snap columns.` or inline `(INTERNALS.md, The board)`. The section name must exist.
- **A comment by the code** gives what the code cannot say: a guard's reason, an ordering constraint, a browser quirk, a number's origin. Keep it even where INTERNALS.md covers the feature, but not a retelling of the INTERNALS.md paragraph.
- **Only what is true now.** No history ("was", "used to", "as it always was"), no bug, ticket or plan-step ids, no mention of an earlier implementation. Describing old stored data the code still reads ("a layout stored before panes were placed freely") is fine: that is current behaviour.
- **File names in comments are current paths**, relative to `_assets/js` (`widgets/overlap.js`), including in `styles.css`.
- **The house style:** lowercase prose fragments naming what the thing is (`// the widest a widget goes: …`), full sentences in headers, about 80 columns with tabs counted as 4, CSS continuation lines indented three spaces. Match the density around the edit.
- **Types** are JSDoc, checked by `npm run typecheck`; shared shapes are named where they are owned (INTERNALS.md, Types).
