// Kill-switch service worker: unregisters any previously-installed SW and
// clears caches without navigating clients. Automatic client navigation can
// cause black-screen reload loops on constrained Android browsers.
self.addEventListener("install", (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      await self.clients.claim();
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      await self.registration.unregister();
    })()
  )
);
