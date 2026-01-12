
const CACHE_NAME = 'atacadao-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './index.css'
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
  // Apenas processa requisições GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Se for uma navegação (abrir o app pelo ícone), prioriza a rede mas cai no index.html se falhar
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // Para outros arquivos (CSS, Imagens, etc)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
