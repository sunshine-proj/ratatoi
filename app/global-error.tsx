"use client";

import { useEffect } from "react";
import { defaultLocale, getMessages } from "@/lib/i18n";
import "./globals.css";

/**
 * Replaces the root layout when it fails, so it renders its own document
 * and cannot rely on the app shell, fonts, or providers.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = getMessages();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={defaultLocale}>
      <body className="flex min-h-dvh items-center justify-center bg-canvas p-6 text-ink">
        <title>{t.pages.error.title}</title>
        <main role="alert" className="flex max-w-md flex-col items-start gap-4">
          <h1 className="text-3xl font-semibold">{t.pages.error.title}</h1>
          <p className="text-lg text-ink-muted">{t.pages.error.body}</p>
          <button
            type="button"
            onClick={() => retry()}
            className="min-h-11 rounded-control bg-primary px-4 font-medium text-on-primary hover:bg-primary-hover"
          >
            {t.pages.error.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
