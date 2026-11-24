"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js in production builds only — a service worker in `next dev`
 * would cache stale dev bundles.
 *
 * After registration, it sends the worker the same-origin assets this page
 * already loaded. Those requests happened before the worker took control, so
 * without this the very first visit would not be available offline.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    let cancelled = false;

    async function register() {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        const registration = await navigator.serviceWorker.ready;
        if (cancelled) return;

        const urls = performance
          .getEntriesByType("resource")
          .map((entry) => entry.name)
          .filter((url) => new URL(url).origin === location.origin);
        registration.active?.postMessage({ type: "CACHE_URLS", urls: [location.href, ...urls] });
      } catch (error) {
        // Offline support is an enhancement; the app works without it.
        console.warn("Service worker registration failed", error);
      }
    }

    void register();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
