/* Direct EXE and launcher must share an existing persistent local profile.
 * Explicit --user-data-dir remains authoritative for isolated installations/tests.
 * No credentials are read, copied, embedded or changed here.
 */
(() => {
  'use strict';
  const { app } = require('electron');
  if (app.commandLine.hasSwitch('user-data-dir') || !process.env.LOCALAPPDATA) return;
  const path = require('path');
  const fs = require('fs');
  const saved = path.join(process.env.LOCALAPPDATA, 'G4T0XX', 'Modmenu', 'Profile');
  if (fs.existsSync(saved)) app.setPath('userData', saved);
})();
