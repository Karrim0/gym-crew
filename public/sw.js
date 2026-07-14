const STATIC_CACHE = "gym-crew-static-v2";
const PRIVATE_PAGE_CACHE = "gym-crew-private-pages-v2";
const STATIC_PREFIXES = ["/_next/static/", "/icons/"];
const OFFLINE_ROUTES = [
  "/dashboard",
  "/workout",
  "/workout/today",
  "/workout/active",
  "/workout/history",
  "/split/personal",
  "/progress",
  "/progress/records",
  "/progress/exercises",
  "/profile",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(["/manifest.webmanifest"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, PRIVATE_PAGE_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      )),
      self.clients.claim(),
    ]),
  );
});

function isStaticAsset(url) {
  return STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) ||
    ["script", "style", "font", "image"].includes(url.destination);
}

function isPrivateOfflineRoute(pathname) {
  return OFFLINE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function networkFirstPrivatePage(request) {
  const cache = await caches.open(PRIVATE_PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const exact = await cache.match(request);
    if (exact) return exact;
    const url = new URL(request.url);
    const fallback = await cache.match(url.pathname);
    if (fallback) return fallback;
    return new Response("Gym Crew is offline. Open a page you visited while online first.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isPrivateOfflineRoute(url.pathname)) {
    event.respondWith(networkFirstPrivatePage(request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_PRIVATE_CACHE") {
    event.waitUntil(caches.delete(PRIVATE_PAGE_CACHE));
  }
});
