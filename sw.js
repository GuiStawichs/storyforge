/* StoryForge service worker — network-first com fallback offline.
   Online: sempre busca a versão mais nova e atualiza o cache.
   Offline: serve a última versão em cache (o app continua funcionando). */
const CACHE = 'storyforge-v1';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['./app.html'])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      })
      .catch(() =>
        caches.match(e.request, { ignoreSearch: true })
          .then(m => m || caches.match('./app.html'))
      )
  );
});
