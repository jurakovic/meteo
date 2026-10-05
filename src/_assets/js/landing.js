// The landing page: a fixed list of maps (maps/landing.js). This wires the
// modules up; see INTERNALS.md, Code map.

import { initLandingRerender, renderLanding } from './maps/landing.js';
import { onReady } from './lib/dom.js';
import { initCommands } from './page/commands.js';
import { initPageContent, initPageResize } from './page/content.js';
import { initDialogs } from './page/dialog.js';
import { applyDocumentSwitches, initDocuments } from './page/documents.js';
import { initRemoteConfig } from './remote-config.js';
import { initTelemetry } from './telemetry.js';

// first, so it sees an error in any step after it
initTelemetry('landing');
initRemoteConfig();
applyDocumentSwitches();

initCommands();
initPageResize();

initLandingRerender();

onReady(renderLanding);
onReady(initDialogs);
onReady(initDocuments);
onReady(initPageContent);
