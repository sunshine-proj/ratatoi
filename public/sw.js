/*
 * Protein Plate service worker.
 *
 * What it caches:
 *   - Core pages, precached at install with the build assets their HTML
 *     references, so Today, Plan, Recipes, Snacks, Shopping, Settings, and
 *     set-up open offline even if they were never visited.
 *   - Other pages you visit (e.g. recipe pages): network-first, so they are
 *     fresh when online and available offline afterwards. Capped at
 *     MAX_VISITED_PAGES, oldest first out.
 *   - Hashed build assets under /_next/static/ (cache-first; immutable).
 *   - Icons, images, manifest (stale-while-revalidate).
 *   - /offline, served for pages that were never cached.
 *
 * What it never touches:
 *   - Non-GET requests, cross-origin requests, /api/*
 *   - React Server Component and prefetch requests (Next.js retries those
 *     itself via experimental.useOffline; caching them could serve stale UI)
 *
 * Privacy: every page is the same public HTML for everyone. Personal data
 * (goals, plan, list) lives in the browser's localStorage, never in these
 * caches. Settings → Account deletes both. If authenticated, user-specific
 * pages are ever added, exclude them here and clear caches on sign-out.
 *
 * Bump VERSION whenever the caching rules or the precache list change.
 */
const VERSION = "v3";
const PREFIX = "protein-plate-";
const SHELL_CACHE = `${PREFIX}shell-${VERSION}`;
const PAGES_CACHE = `${PREFIX}pages-${VERSION}`;
const ASSETS_CACHE = `${PREFIX}assets-${VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, PAGES_CACHE, ASSETS_CACHE];
const OFFLINE_URL = "/offline";
const MAX_VISITED_PAGES = 60;

const CORE_PAGES = [
  "/",
  "/planner",
  "/recipes",
  "/snacks",
  "/shopping-list",
  "/onboarding",
  "/settings/goals",
  "/settings/preferences",
  "/settings/account",
  "/privacy",
  OFFLINE_URL,
];
const CORE_FILES = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

const STATIC_ASSET = /\/_next\/static\/[^"'\s)\\]+/g;

function isCacheable(response) {
  return response && response.ok && response.type === "basic";
}

/** Fetch the core pages, then every build asset their HTML references. */
async function precache() {
  const shell = await caches.open(SHELL_CACHE);
  const assets = await caches.open(ASSETS_CACHE);
  await shell.addAll(CORE_FILES);

  const assetUrls = new Set();
  for (const path of CORE_PAGES) {
    const response = await fetch(path, { cache: "reload" });
    if (!isCacheable(response)) throw new Error(`Precache failed for ${path}`);
    const html = await response.clone().text();
    for (const match of html.matchAll(STATIC_ASSET)) assetUrls.add(match[0]);
    await shell.put(path, response);
  }
  await Promise.all(
    [...assetUrls].map(async (url) => {
      if (await assets.match(url)) return;
      try {
        const response = await fetch(url);
        if (isCacheable(response)) await assets.put(url, response);
      } catch {
        // Best effort: a missing asset is fetched again on first use.
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith(PREFIX) && !CURRENT_CACHES.includes(key)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isFrameworkDataRequest(request, url) {
  return request.headers.has("RSC") || request.headers.has("Next-Router-Prefetch") || url.searchParams.has("_rsc");
}

/** Keep at most `max` entries, removing the oldest (Cache keys are in insertion order). */
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)));
}

/** Cache key for a page: its path, without the query (e.g. /planner?date=… → /planner). */
function pageKey(url) {
  return new URL(url.pathname, url.origin).href;
}

async function networkFirstPage(request, url) {
  const isCore = CORE_PAGES.includes(url.pathname);
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      const cache = await caches.open(isCore ? SHELL_CACHE : PAGES_CACHE);
      // Refresh before responding so an immediate offline reload finds this version.
      await cache.delete(pageKey(url));
      await cache.put(pageKey(url), response.clone());
      if (!isCore) await trim(PAGES_CACHE, MAX_VISITED_PAGES);
    }
    return response;
  } catch {
    const cached = (await caches.match(pageKey(url))) ?? (await caches.match(OFFLINE_URL));
    return cached ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(response)) {
    const cache = await caches.open(ASSETS_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, event) {
  const cached = await caches.match(request);
  const network = fetch(request).then(async (response) => {
    if (isCacheable(response)) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put(request, response.clone());
    }
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
    event.respondWith(networkFirstPage(request, url));
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
 * The page sends the assets it loaded before this worker took control, so
 * the first visit is fully available offline too. Only same-origin static
 * assets are accepted (pages are handled by the precache above).
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
    .filter((url) => url && url.origin === self.location.origin && url.pathname.startsWith("/_next/static/"));

  event.waitUntil(
    caches.open(ASSETS_CACHE).then((cache) =>
      Promise.all(
        accepted.map(async (url) => {
          if (await cache.match(url.href)) return;
          try {
            const response = await fetch(url.href);
            if (isCacheable(response)) await cache.put(url.href, response);
          } catch {
            // Best effort.
          }
        }),
      ),
    ),
  );
});
