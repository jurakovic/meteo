// The landing page: a fixed list of maps (maps/landing.js). This wires the
// modules up; see INTERNALS.md, Code map.

import { initLandingRerender, renderLanding } from './maps/landing.js';
import { onReady } from './lib/dom.js';
import { initCommands } from './page/commands.js';
import { initPageContent, initPageResize } from './page/content.js';
import { initDialogs } from './page/dialog.js';
import { applyManualSwitch, initManual } from './page/manual.js';
import { initRemoteConfig } from './remote-config.js';

initRemoteConfig();
applyManualSwitch();

initCommands();
initPageResize();

initLandingRerender();

onReady(renderLanding);
onReady(initDialogs);
onReady(initManual);
onReady(initPageContent);
