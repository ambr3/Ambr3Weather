const CACHE_NAME = 'ambr3weather-v0.3.22';
const API_CACHE = 'ambr3weather-api-v1';
const VERSION = 'v0.3.22';
const STATIC_ASSETS = [
  './',
  './index.html',
  './offline.html',
  `./css/style.css?${VERSION}`,
  `./css/responsive.css?${VERSION}`,
  `./js/config.js?${VERSION}`,
  `./js/utils.js?${VERSION}`,
  `./js/icons.js?${VERSION}`,
  `./js/api.js?${VERSION}`,
  `./js/ui.js?${VERSION}`,
  `./js/app.js?${VERSION}`,
  `./js/offline.js?${VERSION}`,
  './manifest.json',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-192.png',
  './assets/icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(STATIC_ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => pruneApiCache()).then(() => self.clients.claim())
  );
});

const API_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

async function pruneApiCache() {
  try {
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    const now = Date.now();
    await Promise.all(requests.map(async (req) => {
      const resp = await cache.match(req);
      if (!resp) return;
      const cacheDate = resp.headers.get('date') || resp.headers.get('last-modified');
      if (!cacheDate) return;
      const t = Date.parse(cacheDate);
      if (!isNaN(t) && now - t > API_MAX_AGE) await cache.delete(req);
    }));
  } catch (e) {
    /* pruning is best-effort */
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  if (url.includes('api.open-meteo.com') || url.includes('air-quality-api.open-meteo.com') || url.includes('geocoding-api.open-meteo.com')) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) =>
        fetch(request)
          .then((response) => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cache.match(request))
      )
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('./offline.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request).then((response) => {
        if (response && response.status === 200 && request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
