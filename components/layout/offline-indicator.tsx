"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useOffline } from "next/offline";
import { useI18n } from "@/lib/i18n/client";
import { Icon } from "@/components/ui/icon";

/**
 * Listen for online/offline events, and also re-read navigator.onLine every
 * few seconds: some environments (seen in Firefox) don't fire "online" when
 * the connection returns, which would leave the banner stuck.
 */
function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  const interval = window.setInterval(onChange, 3000);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
    window.clearInterval(interval);
  };
}

const PROBE_INTERVAL_MS = 4000;
const PROBE_TIMEOUT_MS = 3000;

/** A HEAD request to this origin. Non-GET, so the service worker never answers it from cache. */
async function serverReachable(): Promise<boolean> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetch("/manifest.webmanifest", { method: "HEAD", cache: "no-store", signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Whether to tell the user they're offline.
 *
 * - `navigator.onLine === false`: offline (also covers opening the app from
 *   the service-worker cache while already offline).
 * - Next's `useOffline()` also catches failed navigations when the OS still
 *   reports a connection (captive portals, dead upstream).
 * - But that framework flag can stay set after the connection returns
 *   (seen in Firefox). So when the framework says offline while the browser
 *   says online, we check the server ourselves every few seconds and trust
 *   a successful check.
 */
export function useIsOffline(): boolean {
  const frameworkOffline = useOffline();
  const browserOffline = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  );
  const [verifiedOnline, setVerifiedOnline] = useState(false);

  const needsProbe = frameworkOffline && !browserOffline;

  useEffect(() => {
    if (!needsProbe) return;
    let cancelled = false;
    const check = async () => {
      const reachable = await serverReachable();
      if (!cancelled) setVerifiedOnline(reachable);
    };
    void check();
    const interval = window.setInterval(check, PROBE_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      // Start from "not verified" the next time the framework reports offline.
      setVerifiedOnline(false);
    };
  }, [needsProbe]);

  return browserOffline || (frameworkOffline && !verifiedOnline);
}

export function OfflineIndicator() {
  const offline = useIsOffline();
  const { t } = useI18n();

  return (
    // Always mounted so the change is announced politely by screen readers.
    <div role="status" aria-live="polite">
      {offline ? (
        <p className="flex items-start gap-2 border-b border-line-strong bg-surface-muted px-4 py-2 text-sm text-ink md:px-8">
          <Icon name="offline" className="mt-0.5 size-4 shrink-0" />
          <span>{t.offline.banner}</span>
        </p>
      ) : null}
    </div>
  );
}
