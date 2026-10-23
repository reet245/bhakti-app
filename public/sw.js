/* build:web replaces this token whenever the exported shell changes. */
const CACHE_PREFIX = `bhakti-${encodeURIComponent(self.registration.scope)}-`;
const CACHE_VERSION = `${CACHE_PREFIX}__BHAKTI_BUILD_ID__`;
const BASE = new URL('./', self.location.href);
const SHELL_URL = new URL('index.html', BASE).href;
const APP_SHELL = ['index.html', 'manifest.json', 'pwa-icon-192.png', 'pwa-icon-512.png'].map((file) => new URL(file, BASE).href);
const MAX_ENTRIES = 80;

async function cacheResponse(request, response) {
  try {
  if (!response.ok || response.type === 'opaque') return;
  const size = Number(response.headers.get('content-length'));
  if (size > 5 * 1024 * 1024) return;
  const cache = await caches.open(CACHE_VERSION);
  await cache.put(request, response.clone());
  const keys = await cache.keys();
  const removable = keys.filter((key) => !APP_SHELL.includes(key.url));
  for (const key of removable.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) await cache.delete(key);
  } catch {
    // Storage is optional. A quota/privacy-mode failure must not discard a good network response.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname) || /\/api\//.test(url.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(async (response) => {
      if (response.ok && [BASE.pathname, new URL(SHELL_URL).pathname].includes(url.pathname)) await cacheResponse(SHELL_URL, response);
      return response;
    }).catch(async () => (await caches.match(SHELL_URL).catch(() => null)) || Response.error()));
    return;
  }
  if (!['script', 'style', 'image', 'font', 'manifest'].includes(request.destination)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION).catch(() => null);
    const cached = cache ? await cache.match(request).catch(() => null) : null;
    const immutable = /[.-][a-f0-9]{16,}\./i.test(url.pathname);
    if (cached && immutable) return cached;
    try {
      const response = await fetch(request);
      await cacheResponse(request, response);
      return response;
    } catch { return cached || Response.error(); }
  })());
});
