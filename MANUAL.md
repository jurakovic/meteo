
> AI-generated content.

# Manual

**Meteo radari** brings radar and satellite maps, lightning, storm forecasts and synoptic charts from many sources together in one place, without opening a dozen different sites.

The site speaks Croatian, so the labels quoted here are the ones on the screen, with a translation where it helps. The Croatian version of this manual is [`MANUAL.hr.md`](./MANUAL.hr.md), and it is the one shown on the site.

The site has two parts:

- **Početna** (home) — a static list of maps. Nothing to set up; everything is always the same and opens at once.
- **Prilagodi** (customize) — the same view, but with more advanced options. You choose which maps are shown and in what order, and on a computer also how they are laid out on the screen. It is reached with the *Prilagodi* button on the home page.

The chapter [Maps on the page](#maps-on-the-page) applies to both parts, everything else to *Prilagodi* only.

Pop-out windows ("widgets"), side columns and the dashboard work on a computer only, that is on a screen wider than 800 px with a mouse. On touch screens the page stays a plain, vertical list of maps — see [On a phone](#on-a-phone).

## Maps on the page

Every map has a title bar with the name of its source. The name is also a link to the source's own page.

**Maps with several images** ("slideshow", e.g. *Neverin | Radar | Hrvatska*) have `❮` and `❯` arrows at the edges and position indicators below the image, showing which image you are on. On a touch screen the images also change with a swipe.

**Interactive maps** (Windy, Blitzortung, meteoblue and the like) do not react to the mouse at first, so the page can be scrolled past them — they read *Dvostruki klik za pristup interaktivnoj karti* (double click to use the interactive map). After a double click the map works as usual.

Buttons in an interactive map's bar:

| Button | Meaning |
|---|---|
| `[HR]` / `[EU]` | switches between a view of Croatia and of Europe |
| `[X]` | appears once the map is in use; locks it again, then becomes `[R]` |
| `[R]` | puts the map back to its starting position and zoom |
| `[ ]` | opens the map over the whole screen; it then becomes `[-]`, which closes it |

**Fullscreen.** Fullscreen is left with the `[-]` button or the <kbd>Esc</kbd> key. For how it behaves in a side column and on the dashboard, see [Side columns](#side-columns) and [Dashboard](#dashboard).

**Linkovi** (links). The *Linkovi* button leads to a list of further sources at the bottom of the page. The checkbox beside it shows links under every map.

**Upute** (manual). This text is opened by the *Upute* link in the footer and the <kbd>H</kbd> key. It opens in a window over the page, so it can be read beside the maps. It is closed with *Zatvori* (close) or the <kbd>Esc</kbd> key. The site's icon left of the title leads to the home page, as in the *Karte* dialog. A link ending in `#upute` opens the manual as soon as the page loads.

**Povijest promjena** (changelog). The *Povijest promjena* link in the footer and the <kbd>C</kbd> key open the list of changes to the site, by date. It opens in a window over the page, as the manual does, and a link ending in `#promjene` opens it as soon as the page loads.

## The Karte dialog

The **Karte** (maps) button, or the <kbd>K</kbd> key, opens the dialog where you choose what is shown. When the button on the page is out of reach, the dialog opens from the [Karte tab](#the-karte-tab) at the top of the screen.

While the dialog is open, the page behind it is slightly dimmed and does not respond. A click outside the dialog only closes it — it will not open a link or move a window on the way.

**Nothing is applied until you press Primijeni** (apply) or the <kbd>Enter</kbd> key. Closing the dialog without it — with *Zatvori*, the <kbd>Esc</kbd> key or a click outside — drops every change. The exceptions are the grid switches and auto-refresh, which take effect at once.

On a computer the dialog is moved by dragging its header and resized by dragging its edges or corners. A double click on the header puts it back where it started, at its starting size. On a phone it fills the screen.

The site's icon in the header, left of the title, leads to the home page (in a new tab with <kbd>Ctrl</kbd> or a middle click) — also from the [dashboard](#dashboard), where there is no page.

The dialog is, from top to bottom:

- the row of **presets**,
- the **Nadzorna ploča** (dashboard) row, with the grid switches and the *Posloži* (arrange) button (computer only),
- the **Osvježavaj svakih** (refresh every) row,
- the **Izdvojene karte** (popped-out maps) line with the *Vrati sve* (dock all) link — only while some map is popped out into a window,
- the **selected maps**, with *Primijeni* and *Podijeli* (share) below them,
- **all available maps**, with sorting and a search box,
- **Zadani predlošci** (default presets) and **Moji predlošci** (my presets).

### Choosing maps

The dialog has two lists:

- **Selected maps** are the display order. Maps are moved by dragging the `≡` handle.
- **Available maps** are all the others. The checkbox beside a map adds it to the end of the selected ones.

Before every name stands the sign of its kind: 📡 radar, 🛰️ satellite, ⚡ lightning, 🌡️ temperature, ⛈️ storm, 🗺️ synoptic, 📷 camera, 📈 forecast.

Available maps can be sorted by *Zadano* (default), *Naziv* (name) or *Vrsta* (kind); clicking the same sort again reverses it. It is only for finding maps and does not change the display order.

**Search.** The term is looked for in both the name and the kind of a map, so *munje* (lightning) picks out every lightning map, and *neverin* every map from that source. Each further word narrows the list — *neverin radar* finds both Neverin radars, *neverin radar hrvatska* only one. Diacritics are not needed: *chmu* finds *ČHMÚ*, *sinopticka* finds *Sinoptička*.

Search filters only the available maps; the selected ones stay whole, since they are what you drag. The term stays after a map or a preset is picked. It is cleared with `×` or the <kbd>Esc</kbd> key; <kbd>Esc</kbd> in an empty box closes the dialog.

> If the page says *Nema odabranih karata* (no maps selected), the list is empty — open *Karte* and pick at least one.

### Presets

At the top of the dialog is the row of presets:

| Preset | Contents |
|---|---|
| *Osnovno* | the basic set, the same as on the home page |
| *Više* | further maps not in the basic set |
| *Radari* | radars only |
| *Sateliti* | satellites only |
| *Nevrijeme* | storm forecasts and lightning |
| *Sve* | every map |
| *Ništa* | an empty list, to build from scratch |

Your saved presets follow them, and **Prilagođeno** (custom) comes last.

A click on a preset loads its list. As soon as the list changes — a map added, a different order — the choice jumps to *Prilagođeno*, and the preset the list came from gets a dot. A click on it brings its list back and drops the edits.

The jump to *Prilagođeno* also warns that the edited list is no longer that preset: *Podijeli* then shares the edited list, not the preset.

A preset with a blue border was saved as a [dashboard](#dashboard).

### My presets

At the bottom of the dialog, under **Moji predlošci**:

- **Dodaj** (add) opens a field for a name; **Spremi** (save), or <kbd>Enter</kbd>, saves the current list under that name, and on a computer the window layout too.
- **Ažuriraj** (update) appears beside the preset the list came from as soon as you edit it, and overwrites it with what is on screen.
- **Preimenuj** (rename) changes the name, and **Obriši** (delete) deletes the preset. The maps on screen stay as they are.
- **Podijeli** copies a link to that preset.

Under **Zadani predlošci** the default presets can be hidden from the row at the top (*Sakrij*, *Sakrij sve*) and brought back (*Prikaži*, *Prikaži sve*). *Osnovno* cannot be hidden.

### Sharing

**Podijeli** copies a link to the clipboard, and the label briefly reads *Kopirano!* (copied). The link carries the whole view — the list of maps, the order and the layout — so whoever opens it sees what you see.

The *Podijeli* button below the selected maps shares what is in the dialog right now, and the link in a saved preset's row shares that preset. When someone opens the link to a preset of yours, the dialog offers to save it under the same name.

An opened link leaves the saved settings of whoever opened it alone until they press *Primijeni*.

### Auto-refresh

Images go stale on a page left open for long. The **Osvježavaj svakih** row has a checkbox and an interval of 5, 10, 15, 30 or 60 minutes. It is off until switched on, and the interval starts at 5 minutes. It takes effect at once, without *Primijeni*.

Images, slideshows, videos and simple maps are refreshed. Interactive maps are skipped: they fetch the latest data themselves, and a reload would only lose their pan and zoom.

The time to the next refresh is shown in that row and on the [Karte tab](#the-karte-tab). The countdown starts over on every refresh of all maps — automatic, by hand (`[R]` on the tab or the <kbd>R</kbd> key) and on a page reload. `[R]` on a single map refreshes only that map and leaves the countdown alone, unless it is the only map being refreshed.

## Windows

*Computer only.*

Every title bar has a `[^]` button that pops the map out of the page into a window ("widget") floating above it. The window stays in place while the page scrolls, so several maps can be watched at once. Where the map was, the page shows a bar, *Karta je izdvojena u prozor* (the map is popped out into a window), with a **Vrati** (dock) link. *Vrati sve* in the dialog docks every window at once.

Buttons in a window's bar:

| Button | Meaning |
|---|---|
| `[D]` | duplicates the map into a new window (the map in the page has it too) |
| `[R]` | reloads the map (interactive maps do not have it) |
| `[+]` / `[-]` | joins the window to its neighbour in a group, or takes it out of one |
| `[=]` | puts the map back in the page; on the dashboard it is `[x]` and removes the map from the list |

### Moving and size

- **Moving** — by dragging the title bar, or with the arrow keys (see [Keys and gestures](#keys-and-gestures)).
- **Size** — by dragging any edge or corner.
- **A click on a window** raises it above the others. If an interactive map is partly covered by another window, the first click raises it and only the next one goes to the map.

Windows attract each other: an edge brought near another window's edge settles onto it, so windows line up easily side by side.

**Aspect.** A window with an image or a video keeps the map's aspect at first — when its width changes, its height follows. As soon as an edge is dragged, the window lets the aspect go: width and height each go their own way, and the map fits inside the frame, on a blurred copy of the image as its ground.

- Hold <kbd>Shift</kbd> while dragging an edge and the window keeps its aspect. It counts mid-drag too — what the key is when you let go is what the window keeps.
- **A double click on the title bar** takes the aspect back by shrinking the window around the map as it is: the gap at the sides or at the top goes, and the map stays the same size in the same place.

A map enlarged past its own size turns softer, as any enlarged image does.

### Seams

When two windows stand side by side and touch along the whole length of an edge — equally tall next to each other, or equally wide one above the other — that shared edge is a **seam**. Dragging a seam resizes both windows: what one gains the other gives up, and the rest of the layout does not move. Either window's edge will do.

- A seam, like any edge, is attracted to the edges of the other windows, and with *Poravnaj uz mrežu* (snap to grid) on it settles onto the grid when let go.
- Hold <kbd>Ctrl</kbd> when you grab a seam and only one window's edge moves — the one on whose side of the seam the pointer is.
- A seam exists on the sides only, not at the corners. An edge two windows share only in part is no seam and resizes only its own window.
- Dragging a seam frees both windows' aspect.

### Groups

Two touching windows can be joined in a group with the `[+]` button; touching alone is not enough. A group moves and resizes as a whole, and its members stay joined. The group's inside edges are seams, and its outside edge resizes the whole group. `[-]` takes a window out of the group.

### Duplicating

The `[D]` button (or the <kbd>D</kbd> key, for the window on top) opens another window with the same map — e.g. the same synoptic chart at two sizes, or the same slideshow stopped at two different images. The copy opens slightly offset, at the size of the window it came from. Every copy has its own arrows and position indicators.

All copies are equal: `[=]` (on the dashboard `[x]`) closes only that window, and the map goes back to the page (on the dashboard, off the list) only with the last one. Copies are saved in a preset and travel in a link, and a map removed from the list takes its copies with it.

### Side columns

A window dragged to the left or right edge of the screen snaps into a column along that edge. In a column the maps stand one under the other, and the page takes the width that is left.

- **A column's width** is changed by dragging its inner edge. Where two columns touch, the shared edge moves width from one to the other.
- **A map's height** is changed by dragging its top or bottom edge. The column gives the width, so the map lets its aspect go; with <kbd>Shift</kbd> it keeps it, and a double click on the title bar takes it back.
- **A map leaves the column** when its title bar is dragged sideways.
- **A double click on a column's edge** hides the page, so the columns take the whole width. Another double click brings the earlier widths back. While the page is hidden, the dialog opens from the [Karte tab](#the-karte-tab).
- **Fullscreen** in a column fills only that column, so the page beside it stays usable.

## Dashboard

*Computer only.*

The dashboard (*Nadzorna ploča*) is a view mode in which all the selected maps are visible at once, with no scrolling — as windows on a dark ground, with no page around them. You arrange and resize the windows as you like, and with [auto-refresh](#auto-refresh) the dashboard gives a near real-time overview of the weather on a single screen.

It is switched on with the **Nadzorna ploča** button in the dialog and applied, together with the list, by pressing *Primijeni*. It is switched off the same way. A preset saved while the dashboard is on opens as a dashboard, so you can keep several different dashboards.

On the dashboard:

- **Posloži** (in the dialog, `[A]` on the tab or the <kbd>A</kbd> key) arranges every map in an even grid, of equal sizes and with no gaps. The maps come out as large as possible — four maps make 2x2, six 3x2, ten 4x3. The maps let their aspect go; a double click on a title bar takes it back for that map. The same happens on first entering the dashboard.
- `[x]` in a window's bar, or a middle click on the bar, **removes the map from the list**.
- **Adding a map** without opening the dialog: `[+]` on the [Karte tab](#the-karte-tab) opens an alphabetical list of the maps not yet on the dashboard. A typed term narrows the list as in the dialog, the arrow keys choose, and <kbd>Enter</kbd> or a click adds the map. <kbd>Esc</kbd> or a click outside the list closes it.
- A map added to the list appears on the dashboard by the top left corner, stepped below the other new ones.
- There are no side columns; a window brought to the edge of the screen stays a window.
- **Fullscreen** takes the whole screen except a side along which some window stands its whole height or width; the other windows stay above the map.

### Grid

On the dashboard, maps can be laid out on a grid of squares. Two switches, in the dialog and on the tab, take effect at once, without *Primijeni*:

| Switch | Tab | Key | Meaning |
|---|---|---|---|
| *Prikaži mrežu* (show grid) | `[G]` | <kbd>G</kbd> | draws the grid on the ground |
| *Poravnaj uz mrežu* (snap to grid) | `[S]` | <kbd>S</kbd> | a window let go settles onto the grid |

Snapping takes effect only when a window is let go, so dragging is free. Each edge goes to its own nearest line, so the window stretches or shrinks a little if needed. The arrow keys move a window by exactly one square, so a snapped window stays snapped.

## The Karte tab

When the *Karte* button on the page is out of reach, an orange **Karte** tab hangs at the top of the screen; a click on it opens the dialog. It appears:

- on the [dashboard](#dashboard),
- while the [side columns](#side-columns) have hidden the page,
- while [auto-refresh](#auto-refresh) is on — it then carries the countdown and `[R]`, which refreshes every map at once.

On the dashboard it always carries `[+]` (adds a map to the dashboard) and `[R]`, along with `[A]`, `[G]` and `[S]`.

The tab is faint until needed — it takes on full colour under the mouse and while the dialog is open. It is dragged left and right, and stretched by its edges, up to half the width of the screen.

## Keys and gestures

Keys do not work while the cursor is in a text field.

| Key | Action |
|---|---|
| <kbd>K</kbd> | opens and closes the *Karte* dialog |
| <kbd>Enter</kbd> | in the *Karte* dialog: applies the changes |
| <kbd>H</kbd> | opens and closes the manual (*Upute*) |
| <kbd>C</kbd> | opens and closes the changelog (*Povijest promjena*) |
| <kbd>Esc</kbd> | closes the dialog; if none is open, leaves fullscreen |
| <kbd>R</kbd> | reloads every map |
| <kbd>D</kbd> | duplicates the window on top |
| <kbd>A</kbd> | on the dashboard: arranges the maps in a grid |
| <kbd>G</kbd> | on the dashboard: shows or hides the grid |
| <kbd>S</kbd> | on the dashboard: switches snapping to the grid on or off |
| arrow keys | move the window on top by one grid square |
| <kbd>Shift</kbd> + arrow keys | the same, by one pixel |

The <kbd>R</kbd>, <kbd>D</kbd>, <kbd>A</kbd>, <kbd>G</kbd>, <kbd>S</kbd> and arrow keys work on a computer only. The arrow keys move the window raised last; if the wrong one moved, click the one you want and try again. While the dialog is open, the arrow keys scroll the dialog and do not move windows.

> **Keys do not work while the focus is in an interactive map.** When you click into Windy or Blitzortung, the keys go to that map, not to the page. Click the title bar or anywhere on the page and the keys work again.

With the mouse, on a window's title bar:

| Gesture | Action |
|---|---|
| drag | moves the window |
| double click | interactive map: fullscreen; image: takes the aspect back |
| middle click | puts the map back in the page; on the dashboard removes it from the list |

With the mouse, on the edges:

| Gesture | Action |
|---|---|
| dragging an edge or corner | resizes the window |
| <kbd>Shift</kbd> + drag | the same, keeping the aspect |
| dragging a seam | moves the shared edge of two windows |
| <kbd>Ctrl</kbd> + dragging a seam | moves the edge of one window only |
| double click on a column's edge | hides or brings back the page |

## What is remembered

Everything is saved in this browser only. Nothing is sent anywhere and nothing moves to another device, except through a link you share yourself. Clearing the browser's data clears this too.

**The view** — the list of maps, the order, the window layout and the dashboard. It is saved by pressing *Primijeni* and comes back the next time the page opens. Only the view goes into a preset and into a share link. The layout is changed and saved without *Primijeni* too, as soon as you move a window.

**Browser settings** — the position and size of the dialog and the manual, the position and width of the tab, the grid switches and auto-refresh. They concern this screen, not the view, so they travel neither in a preset nor in a link.

**A shared link** — shows what it holds, and your saved settings stay untouched until you press *Primijeni*.

## On a phone

On touch screens the page is a plain vertical list of maps. There are no pop-out windows, side columns or dashboard.

What works:

- choosing maps and the display order,
- presets, saving and sharing,
- auto-refresh,
- swiping through maps with several images,
- a double tap to use an interactive map,
- fullscreen.

On a phone the *Karte* dialog fills the screen and is closed with *Zatvori* in its header.

A window layout made on a computer is not lost when the page is opened on a phone — it is only not shown, and comes back as soon as the page is opened on the computer again.
