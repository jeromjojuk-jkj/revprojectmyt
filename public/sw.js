// Krip service worker: makes the site installable and keeps it usable on a bad connection.
// Pages always come from the network first, so prices, stock and orders are never stale;
// the offline page is shown only when there is no connection at all.
// Admin, API, checkout and payment requests are never cached.

const VERSION = "krip-v2";
const STATIC = `${VERSION}-static`;
const MEDIA = `${VERSION}-media`;
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/icon-white-192.png", "/icons/icon-white-512.png"];
const MEDIA_LIMIT = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const NEVER_CACHE = /^\/(admin|api|checkout|pay|order)(\/|$)/;

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || NEVER_CACHE.test(url.pathname)) return;

  // Pages: network first; offline page when there is no connection.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Versioned build files never change: cache first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(STATIC).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
    return;
  }

  // Product photos and icons: show the saved copy straight away, refresh it in the background.
  if (url.pathname.startsWith("/_next/image") || url.pathname.startsWith("/products/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(MEDIA).then(async (cache) => {
        const hit = await cache.match(req);
        const refresh = fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone()).then(() => trimCache(MEDIA, MEDIA_LIMIT));
          return res;
        }).catch(() => hit);
        return hit || refresh;
      }),
    );
  }
});
