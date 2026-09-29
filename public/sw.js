// Kill-switch worker, intentionally kept. Nothing on this site registers a service worker,
// but a previous site on this domain may have registered /sw.js. Browsers re-fetch this URL
// for such stale registrations; this script takes over, then unregisters itself.
// Safe to delete once no visitors can still carry a registration from before June 2026.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      self.registration.unregister()
    ])
  );
});
