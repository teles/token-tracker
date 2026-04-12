const SW_VERSION = '2026-04-12-v1';
const APP_CACHE_NAME = `token-tracker-app-${SW_VERSION}`;
const RUNTIME_CACHE_NAME = `token-tracker-runtime-${SW_VERSION}`;
const APP_SHELL_URL = '/';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest?v=20260412-4',
  '/favicon.ico?v=20260412-4',
  '/favicon.svg?v=20260412-4',
  '/favicon-16x16.png?v=20260412-4',
  '/favicon-32x32.png?v=20260412-4',
  '/apple-touch-icon.png?v=20260412-4',
  '/icons/icon-192.png?v=20260412-4',
  '/icons/icon-512.png?v=20260412-4',
  '/icons/icon-maskable-192.png?v=20260412-4',
  '/icons/icon-maskable-512.png?v=20260412-4'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const appCache = await caches.open(APP_CACHE_NAME);
      await appCache.addAll(APP_SHELL_ASSETS);
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const validCacheNames = new Set([APP_CACHE_NAME, RUNTIME_CACHE_NAME]);

      await Promise.all(
        cacheNames
          .filter((cacheName) => !validCacheNames.has(cacheName))
          .map((cacheName) => caches.delete(cacheName))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  event.respondWith(handleAssetRequest(request));
});

async function handleNavigationRequest(request) {
  const appCache = await caches.open(APP_CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      await appCache.put(APP_SHELL_URL, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    const cachedShell = await appCache.match(APP_SHELL_URL);

    if (cachedShell) {
      return cachedShell;
    }

    const cachedIndex = await appCache.match('/index.html');

    if (cachedIndex) {
      return cachedIndex;
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Offline',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }
}

async function handleAssetRequest(request) {
  const appCache = await caches.open(APP_CACHE_NAME);
  const runtimeCache = await caches.open(RUNTIME_CACHE_NAME);
  const cachedResponse = (await appCache.match(request)) ?? (await runtimeCache.match(request));

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (!networkResponse.ok) {
      return networkResponse;
    }

    const targetCache = isAppShellAssetRequest(request)
      ? appCache
      : runtimeCache;

    await targetCache.put(request, networkResponse.clone());

    return networkResponse;
  } catch {
    return new Response('', {
      status: 504,
      statusText: 'Gateway Timeout'
    });
  }
}

function isAppShellAssetRequest(request) {
  const requestUrl = new URL(request.url);

  if (requestUrl.pathname.startsWith('/assets/')) {
    return true;
  }

  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font') {
    return true;
  }

  return request.destination === 'image' && requestUrl.pathname.startsWith('/icons/');
}
