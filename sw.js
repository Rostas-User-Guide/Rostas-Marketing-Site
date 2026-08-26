// ============================================================================
// KILL-SWITCH SERVICE WORKER — rostas.app
// ============================================================================
// Purpose: this file REPLACES the app's old sw.js (cache "rostas-shell-v30")
// that accidentally ended up controlling the marketing-site domain. It does
// not add a new app — it removes itself and its cache, then gets out of the
// way, so normal browser requests to rostas.app reach the real server again.
//
// Deploy this file to the EXACT same path the old one used:
//     https://rostas.app/sw.js
// Same path = same "scope", so browsers with the old worker registered will
// treat this as an update to it, not a brand new, unrelated worker.
//
// You can delete this file (and stop deploying it) once you're confident
// enough time has passed for returning visitors to have picked it up —
// there's no harm in leaving it indefinitely either.
// ============================================================================

// Take over immediately after install, instead of waiting for the old
// worker's tabs to fully close first.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Delete every cache this origin owns — not just "rostas-shell-v30"
      //    by name, in case other versions/caches exist too.
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      // 2. Take control of any tabs that are currently open and still being
      //    served by the OLD worker, so the fix applies without the visitor
      //    needing to close and reopen their browser.
      await self.clients.claim();

      // 3. Force any open rostas.app tabs to reload. Since this worker has
      //    no fetch handler (see below), that reload goes straight to the
      //    real network response — the actual current site.
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.navigate(client.url);
      }

      // 4. Remove the registration entirely. After this, rostas.app has no
      //    service worker at all, and behaves like an ordinary static site.
      await self.registration.unregister();

      console.log('[rostas kill-switch] cache cleared, worker unregistered.');
    })()
  );
});

// Deliberately NO 'fetch' event listener here.
//
// A service worker with no fetch handler does not intercept anything —
// every request just passes straight through to the network as if there
// were no worker at all. That's exactly what we want during the brief
// window between "activated" and "fully unregistered": real content, no
// caching, no risk of this file itself serving something stale.
