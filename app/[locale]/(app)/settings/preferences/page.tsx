import type { Metadata } from "next";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { PreferencesSettings } from "@/components/preferences/preferences-settings";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pages.preferences.title };
}

export default async function PreferencesPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader title={t.pages.preferences.title} intro={t.pages.preferences.intro} />
      <Card as="section" aria-labelledby="language-heading" className="flex max-w-2xl flex-col gap-3">
        <h2 id="language-heading" className="text-xl font-semibold">
          {t.language.title}
        </h2>
        <p className="text-ink-muted">{t.language.intro}</p>
        <LanguageSwitcher variant="settings" />
      </Card>
      <PreferencesSettings />
    </div>
  );
}
