"use client";

import { useState, type FormEvent } from "react";
import { SettingsGate } from "@/components/settings/settings-gate";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/lib/i18n/client";
import { defaultPreferences, type UserPreferences } from "@/lib/preferences/preferences";
import { withPreferences } from "@/lib/settings/settings";
import { useSettings } from "@/lib/settings/use-settings";
import { PreferencesFields } from "./preferences-fields";

export function PreferencesSettings() {
  return (
    <SettingsGate>
      {(settings) => {
        const preferences = settings?.preferences ?? defaultPreferences;
        // Re-initialise when the saved preferences change elsewhere (see GoalsSettings).
        return <PreferencesForm key={JSON.stringify(preferences)} initial={preferences} />;
      }}
    </SettingsGate>
  );
}

function PreferencesForm({ initial }: { initial: UserPreferences }) {
  const { t } = useI18n();
  const toast = useToast();
  const { update } = useSettings();
  const [value, setValue] = useState(initial);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = update((current) => withPreferences(current, value));
    toast.show(
      result.ok
        ? { message: t.settings.preferencesSaved, tone: "success" }
        : { message: t.settings.saveFailed, tone: "error", duration: null },
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-8">
      <PreferencesFields idPrefix="preferences" value={value} onChange={setValue} />
      <div className="flex justify-end border-t border-line pt-5">
        <Button type="submit" className="w-full sm:w-auto sm:min-w-40">
          {t.common.save}
        </Button>
      </div>
    </form>
  );
}
