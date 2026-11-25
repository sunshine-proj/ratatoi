"use client";

import { useI18n } from "@/lib/i18n/client";

/** Route-level fallback: a quiet skeleton with a text status for screen readers. */
export default function Loading() {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-full max-w-5xl" aria-busy="true">
      <p role="status" className="sr-only">
        {t.pages.loading}
      </p>
      <div aria-hidden="true" className="flex max-w-2xl flex-col gap-3 motion-safe:animate-pulse">
        <div className="h-9 w-48 rounded-control bg-surface-muted" />
        <div className="h-5 w-full rounded-control bg-surface-muted" />
        <div className="h-5 w-2/3 rounded-control bg-surface-muted" />
        <div className="mt-6 h-24 w-full rounded-card bg-surface-muted" />
      </div>
    </div>
  );
}
