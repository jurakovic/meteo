// The customize page: the maps the user picked, in their order, with the
// settings dialog, the widgets and the board. Modules only declare; this wires
// them up. In the build it runs from <head>, before the body exists, so what
// must be in place before the first paint happens at once and the rest once
// the document is parsed (onReady), each step on its own.

import { onReady } from './lib/dom.js';
import { cloakBoard, loadSharedMapView, uncloakBoard } from './maps/prefs.js';
import { initRerender, renderMaps } from './maps/render.js';
import { initActions, registerAction } from './page/actions.js';
import { initPageContent, initPageResize } from './page/content.js';
import { initDialogKeys, initDialogs } from './page/dialog.js';
import { applyManualSwitch, initManual } from './page/manual.js';
import { initRemoteConfig } from './remote-config.js';
import { initAddMenu } from './settings/add-menu.js';
import { initMapSettings, toggleMapSettings } from './settings/panel.js';
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

// the listeners. The widgets' keys come before the dialogs': Escape ends a
// fullscreen map only while no dialog is up, so it must be heard before a
// dialog is shut by it
initActions();
registerAction('map-settings', () => toggleMapSettings());
initWidgetKeys();
initDialogKeys();
initMapSettings();
initAddMenu();
initRerender();
initWidgetGestures();
initWidgetFullscreen();
initLayoutBreakpoint();
initWidgetResponsiveness();
initPageResize();
// the columns and the widgets measure against a viewport a dialog's gutter changes
document.addEventListener('dialog-toggled', () => layoutSnapColumns());

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
