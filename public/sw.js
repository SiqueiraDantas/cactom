/* Cactom · service worker
 * - O app abre rápido e funciona sem internet nas partes que não dependem do servidor.
 * - Páginas: rede primeiro (sempre a versão nova quando há internet), cópia guardada se estiver offline.
 * - Arquivos do build (/assets/, com hash no nome): guardados na primeira vez e reaproveitados.
 * - Imagens, sons, fontes e animações: usa a cópia guardada e atualiza em segundo plano.
 * - Nada de outros sites é guardado (o Supabase passa direto), e nada além de GET.
 * Ao mudar a estratégia, suba o número da versão: os caches antigos são apagados.
 */
const VERSION = 'cactom-v1';
const SHELL = `${VERSION}-paginas`;
const ASSETS = `${VERSION}-build`;
const MEDIA = `${VERSION}-midia`;
const PRECACHE = ['/', '/manifest.webmanifest', '/branding/cactom-icone-192.png', '/branding/cactom/tom-oficial.png'];
const MAX_ASSETS = 160;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const url = new URL(request.url);
    return (await cache.match(request, { ignoreSearch: true }))
      || (url.pathname.startsWith('/site') ? await cache.match('/site/') : null)
      || (await cache.match('/'))
      || new Response('Sem internet no momento.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const fresh = await fetch(request);
  if (fresh.ok) { cache.put(request, fresh.clone()); trim(ASSETS, MAX_ASSETS); }
  return fresh;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(MEDIA);
  const hit = await cache.match(request);
  const update = fetch(request).then(fresh => { if (fresh.ok && fresh.status === 200) cache.put(request, fresh.clone()); return fresh; }).catch(() => hit);
  return hit || update;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.headers.has('range')) return; // áudio e vídeo em partes: direto da rede
  if (url.pathname === '/sw.js') return;
  if (request.mode === 'navigate') { event.respondWith(networkFirst(request)); return; }
  if (url.pathname.startsWith('/assets/')) { event.respondWith(cacheFirst(request)); return; }
  if (/^\/(branding|fonts|animacoes|sons|rive|mediapipe|site|recorder\.svg|favicon)/.test(url.pathname) || url.pathname === '/manifest.webmanifest') {
    event.respondWith(staleWhileRevalidate(request));
  }
});
