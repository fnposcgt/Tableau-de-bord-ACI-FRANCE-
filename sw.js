/* ── Service Worker FNPOS-CGT — v4 ── */
var CACHE_VERSION = 'fnpos-v4';
var ASSETS = [
  './index.html',
  './app.html',
  './app-secteur.html',
  './carte-fed.html',
  './manifest.json',
  './logo-cgt.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(ASSETS).catch(function() {});
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_VERSION; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      /* Réseau en priorité, cache en fallback (offline).
         cache:'no-store' force le contournement du cache HTTP du
         navigateur/CDN — sans ça, "réseau en priorité" pouvait quand
         même renvoyer une réponse HTTP mise en cache en amont, jamais
         la version vraiment fraîche du serveur. */
      return fetch(e.request, { cache: 'no-store' }).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_VERSION).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        return cached;
      });
    })
  );
});

/* Message pour forcer la mise à jour */
self.addEventListener('message', function(e) {
  if (e.data && (e.data.type === 'SKIP_WAITING' || e.data.action === 'skipWaiting')) {
    self.skipWaiting();
  }
});
