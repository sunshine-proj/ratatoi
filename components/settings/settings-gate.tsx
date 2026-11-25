"use client";

import type { ReactNode } from "react";
import { DocumentGate } from "@/components/storage/document-gate";
import { useI18n } from "@/lib/i18n/client";
import type { UserSettings } from "@/lib/settings/settings";
import { useSettings } from "@/lib/settings/use-settings";

/** Loading / unreadable-data states for anything that depends on saved settings. */
export function SettingsGate({ children, loading }: {
  children: (settings: UserSettings | null) => ReactNode;
  loading?: ReactNode;
}) {
  const { state, reset } = useSettings();
  const { t } = useI18n();
  return (
    <DocumentGate
      state={state}
      reset={reset}
      loading={loading}
      copy={{
        title: t.settings.loadFailedTitle,
        body: t.settings.loadFailedBody,
        reset: t.settings.reset,
        resetDone: t.settings.resetDone,
      }}
    >
      {children}
    </DocumentGate>
  );
}
