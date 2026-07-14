// Minimal service worker skeleton.
//
// Intentionally does NOT implement an advanced caching strategy yet, and
// must never cache authenticated API responses (anything under /api/ or
// Supabase auth endpoints). Fill in a real strategy (e.g. stale-while-
// revalidate for static assets) as part of the offline-sync feature work —
// see docs/OFFLINE_SYNC.md.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through only. No caching yet.
});
