/* ── Service Worker ACI France — v2 ── */
var CACHE_VERSION = 'aci-v2';
var ASSETS = ['./app.html', './manifest.json'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      return cache.addAll(ASSETS).catch(function(){});
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_VERSION; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function(res){
      var clone = res.clone();
      caches.open(CACHE_VERSION).then(function(cache){
        cache.put(e.request, clone);
      });
      return res;
    }).catch(function(){
      return caches.match(e.request);
    })
  );
});

self.addEventListener('message', function(e){
  if(e.data && e.data.action === 'skipWaiting'){
    self.skipWaiting();
  }
});
