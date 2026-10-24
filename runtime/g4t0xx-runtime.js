/* Keep Node's event loop active in the existing Electron renderer on Windows.
 * Without a referenced Node timer, asynchronous filesystem operations can remain
 * pending during .NET detection. This does not skip any platform/auth checks.
 */
(() => {
  'use strict';
  const timers = window.nodeRequire('timers');
  const heartbeat = timers.setInterval(() => {}, 100);
  window.addEventListener('beforeunload', () => timers.clearInterval(heartbeat), { once: true });
})();
