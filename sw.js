// ══ GESTOR FIEL — SERVICE WORKER ══
// Versão do cache — incremente ao atualizar o sistema
const CACHE = 'gestor-fiel-v1';

// Arquivos que serão salvos no cache para uso offline
const ARQUIVOS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'
];

// ── Instalação: salva os arquivos no cache ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ARQUIVOS).catch(() => {
        // Ignora erros de cache de fontes externas
      });
    })
  );
  self.skipWaiting();
});

// ── Ativação: limpa caches antigos ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: serve do cache se offline ──
self.addEventListener('fetch', e => {
  // Ignora requisições do Firebase (precisam de internet)
  if(e.request.url.includes('firestore.googleapis.com') ||
     e.request.url.includes('firebase') ||
     e.request.url.includes('googleapis.com/google.firestore')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Se está online, atualiza o cache com a versão mais recente
        if(response && response.status === 200 && response.type !== 'opaque'){
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: serve do cache
        return caches.match(e.request).then(cached => {
          if(cached) return cached;
          // Se não tem no cache, retorna página principal
          return caches.match('./index.html');
        });
      })
  );
});
