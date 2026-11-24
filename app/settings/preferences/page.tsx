import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PreferencesSettings } from "@/components/preferences/preferences-settings";
import { getMessages } from "@/lib/i18n";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.preferences.title };

export default function PreferencesPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader title={t.pages.preferences.title} intro={t.pages.preferences.intro} />
      <PreferencesSettings />
    </div>
  );
}
