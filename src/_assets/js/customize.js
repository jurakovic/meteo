// The customize page: the maps the user picked, with the settings dialog, the
// widgets and the board. This wires the modules up; see INTERNALS.md, Code map.

import { onReady } from './lib/dom.js';
import { EVENTS, on } from './lib/events.js';
import { cloakBoard, loadSharedMapView, uncloakBoard } from './maps/prefs.js';
import { initRerender, renderMaps } from './maps/view.js';
import { initCommands } from './page/commands.js';
import { initPageContent, initPageResize } from './page/content.js';
import { initDialogs } from './page/dialog.js';
import { applyManualSwitch, initManual } from './page/manual.js';
import { initRemoteConfig } from './remote-config.js';
import { initAddMenu } from './settings/add-menu.js';
import { initMapSettings } from './settings/panel.js';
import { initMsTab } from './settings/tab.js';
import { layoutSnapColumns } from './widgets/columns.js';
import { initWidgetFullscreen } from './widgets/fullscreen.js';
import { initWidgetGestures } from './widgets/gestures.js';
import { initWidgetKeys } from './widgets/keyboard.js';
import { applyStoredSnapLayout, initLayoutBreakpoint } from './widgets/layout.js';
import { initRefresh } from './widgets/refresh.js';
import { initWidgetResponsiveness } from './widgets/responsive.js';

// before the first paint: the maps switched off, the manual's switch, and the
// board's cloak, which needs the view (a shared link's or the stored one)
initRemoteConfig();
applyManualSwitch();
loadSharedMapView();
cloakBoard();

// the commands (controls and keys, page/commands.js) and the listeners
initCommands();
initWidgetKeys();
initMapSettings();
initAddMenu();
initRerender();
initWidgetGestures();
initWidgetFullscreen();
initLayoutBreakpoint();
initWidgetResponsiveness();
initPageResize();
// the columns and the widgets measure against a viewport a dialog's gutter changes
on(EVENTS.dialogToggled, () => layoutSnapColumns());

// once the document is parsed: the maps, then their arrangement, then the
// wiring that has to see both
onReady(initRefresh);
onReady(initMsTab);
onReady(renderMaps);
onReady(applyStoredSnapLayout);
onReady(uncloakBoard);
onReady(initDialogs);
onReady(initManual);
onReady(initPageContent);
