const CACHE = 'learn-spanish-v9';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isPage = url.origin === self.location.origin &&
    (event.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'));
  if (isPage) {
    /* The app page itself is NETWORK-FIRST (revalidated): a new version
       shows on the very next open, never one launch late. The cached copy
       is only the offline fallback. */
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' }).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
        }
        return response;
      }).catch(() => caches.match('./index.html', { ignoreSearch: true })
        .then((hit) => hit || caches.match('./', { ignoreSearch: true })))
    );
    return;
  }
  /* Everything else (icons, manifest): stale-while-revalidate. */
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(event.request).then((response) => {
        if (response && response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
