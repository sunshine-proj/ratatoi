"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { getMessages } from "@/lib/i18n";
import type { DocumentState, WriteResult } from "@/lib/storage/local-document";

/**
 * Loading and "saved data can't be read" states for a local document; renders
 * children with the value (or null when nothing is saved yet).
 */
export function DocumentGate<T>({ state, reset, copy, children, loading }: {
  state: DocumentState<T>;
  reset: () => WriteResult;
  copy: { title: string; body: string; reset: string; resetDone: string };
  children: (value: T | null) => ReactNode;
  loading?: ReactNode;
}) {
  const toast = useToast();
  const t = getMessages();

  if (state.status === "loading") {
    return (
      loading ?? (
        <div aria-busy="true" className="flex flex-col gap-3 motion-safe:animate-pulse">
          <p role="status" className="sr-only">
            {t.pages.loading}
          </p>
          <div aria-hidden="true" className="h-24 w-full rounded-card bg-surface-muted" />
          <div aria-hidden="true" className="h-11 w-2/3 rounded-control bg-surface-muted" />
        </div>
      )
    );
  }

  if (state.status === "invalid" && state.reason === "newer") {
    // Never offer to reset here: the data is fine, this tab is just out of date.
    return (
      <Card role="alert" className="flex flex-col items-start gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Icon name="info" className="size-5" />
          {t.storage.newerTitle}
        </h2>
        <p>{t.storage.newerBody}</p>
        <Button onClick={() => window.location.reload()}>{t.storage.reload}</Button>
      </Card>
    );
  }

  if (state.status === "invalid") {
    return (
      <Card role="alert" className="flex flex-col items-start gap-3 border-danger">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Icon name="alert" className="size-5 text-danger" />
          {copy.title}
        </h2>
        <p>{copy.body}</p>
        <Button
          variant="secondary"
          onClick={() => {
            const result = reset();
            toast.show(
              result.ok
                ? { message: copy.resetDone, tone: "success" }
                : { message: t.settings.saveFailed, tone: "error", duration: null },
            );
          }}
        >
          {copy.reset}
        </Button>
      </Card>
    );
  }

  return <>{children(state.status === "ready" ? state.value : null)}</>;
}
