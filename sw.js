
const CACHE_NAME = 'atacadao-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './index.css',
  './index.tsx'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignora chamadas que não sejam GET ou que sejam para APIs externas (como Firebase)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retorna o cache ou tenta buscar na rede
      return response || fetch(event.request).catch(() => {
        // Se for uma navegação (abrir o app), retorna o index.html como fallback
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return null;
      });
    })
  );
});
