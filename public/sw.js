/*
 * Protein Plate service worker — app-shell caching.
 *
 * What it caches:
 *   - Page HTML for public routes (network-first, cached copy when offline)
 *   - Hashed build assets under /_next/static/ (cache-first; they are immutable)
 *   - Icons, images, manifest (stale-while-revalidate)
 *   - /offline, served when a page is requested offline and was never cached
 *
 * What it never touches:
 *   - Non-GET requests, cross-origin requests, /api/*
 *   - React Server Component / prefetch requests (Next.js retries those itself
 *     via experimental.useOffline; caching them would serve stale UI)
 *
 * Privacy: every route currently renders the same public shell for everyone;
 * guest data lives in the browser's own storage, not in cached responses.
 * If authenticated, user-specific HTML is introduced (Phase 7), it must be
 * excluded here and caches must be cleared on sign-out.
 *
 * Bump VERSION whenever this file's caching rules change.
 */
const VERSION = "v1";
const PREFIX = "protein-plate-";
const SHELL_CACHE = `${PREFIX}shell-${VERSION}`;
const RUNTIME_CACHE = `${PREFIX}runtime-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(PREFIX) && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isFrameworkDataRequest(request, url) {
  return (
    request.headers.has("RSC") ||
    request.headers.has("Next-Router-Prefetch") ||
    url.searchParams.has("_rsc")
  );
}

function isCacheable(response) {
  return response && response.ok && response.type === "basic";
}

async function putInCache(cacheName, request, response) {
  if (!isCacheable(response)) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    // Wait for the cache write so an immediate offline reload finds this page.
    await putInCache(RUNTIME_CACHE, request, response.clone());
    return response;
  } catch {
    const cached = (await caches.match(request, { ignoreSearch: true })) ?? (await caches.match(OFFLINE_URL));
    return cached ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  await putInCache(RUNTIME_CACHE, request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, event) {
  const cached = await caches.match(request);
  const network = fetch(request).then(async (response) => {
    await putInCache(RUNTIME_CACHE, request, response.clone());
    return response;
  });
  if (cached) {
    event.waitUntil(network.catch(() => undefined));
    return cached;
  }
  return network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (isFrameworkDataRequest(request, url)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:png|svg|ico|webp|avif|jpg|jpeg|woff2)$/.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request, event));
  }
});

/*
 * The page sends the assets it loaded before this worker took control, so the
 * first visit is available offline too. Only same-origin static assets and
 * the page URL itself are accepted.
 */
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "CACHE_URLS" || !Array.isArray(data.urls)) return;

  const accepted = data.urls
    .map((value) => {
      try {
        return new URL(value, self.location.origin);
      } catch {
        return null;
      }
    })
    .filter(
      (url) =>
        url &&
        url.origin === self.location.origin &&
        !url.pathname.startsWith("/api/") &&
        !url.searchParams.has("_rsc"),
    );

  event.waitUntil(
    caches.open(RUNTIME_CACHE).then((cache) =>
      Promise.all(
        accepted.map(async (url) => {
          if (await cache.match(url.href)) return;
          try {
            const response = await fetch(url.href, { credentials: "same-origin" });
            if (isCacheable(response)) await cache.put(url.href, response);
          } catch {
            // Ignore: best effort.
          }
        }),
      ),
    ),
  );
});
