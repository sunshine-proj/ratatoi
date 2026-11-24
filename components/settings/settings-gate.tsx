"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { getMessages } from "@/lib/i18n";
import type { UserSettings } from "@/lib/settings/settings";
import { useSettings } from "@/lib/settings/use-settings";

/**
 * Handles the loading and "saved data can't be read" states for anything
 * that depends on saved settings, then renders children with the settings
 * (or null when nothing has been saved yet).
 */
export function SettingsGate({ children, loading }: {
  children: (settings: UserSettings | null) => ReactNode;
  loading?: ReactNode;
}) {
  const { state, reset } = useSettings();
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

  if (state.status === "invalid") {
    return (
      <Card role="alert" className="flex flex-col items-start gap-3 border-danger">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Icon name="alert" className="size-5 text-danger" />
          {t.settings.loadFailedTitle}
        </h2>
        <p>{t.settings.loadFailedBody}</p>
        <Button
          variant="secondary"
          onClick={() => {
            const result = reset();
            toast.show(
              result.ok
                ? { message: t.settings.resetDone, tone: "success" }
                : { message: t.settings.saveFailed, tone: "error", duration: null },
            );
          }}
        >
          {t.settings.reset}
        </Button>
      </Card>
    );
  }

  return <>{children(state.status === "ready" ? state.value : null)}</>;
}
