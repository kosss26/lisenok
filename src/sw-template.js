/* Service worker for offline play (generated into dist/sw.js by vite.config.ts). */
const VERSION = "__VERSION__";
const URLS = /*__URLS__*/ [];
const CACHE = `lisenok-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        // in small batches: a phone on a slow network should not open hundreds of requests at once
        for (let i = 0; i < URLS.length; i += 24) {
          await Promise.all(
            URLS.slice(i, i + 24).map((u) =>
              cache.add(new Request(u, { cache: "reload" })).catch(() => {}),
            ),
          );
        }
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "status") {
    caches.open(CACHE).then(async (cache) => {
      const have = (await cache.keys()).length;
      event.source?.postMessage({ type: "offline-status", have, total: URLS.length });
    });
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    // the game is one page: any address opens it, from the cache when offline
    event.respondWith(fetch(req).catch(() => caches.match("/", { ignoreSearch: true })));
    return;
  }
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
