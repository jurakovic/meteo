// The landing page: a fixed list of maps (maps/landing.js). Modules only declare; this wires
// them up. In the build it runs from <head>, before the body exists, so what
// must be in place before the first paint happens at once and the rest once
// the document is parsed (onReady).

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
