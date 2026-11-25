import { ActiveNavList } from "@/components/layout/active-nav-list";
import { getI18n } from "@/lib/i18n/server";
import { settingsNav } from "@/lib/navigation";

export default async function SettingsLayout({ children }: LayoutProps<"/[locale]/settings">) {
  const { t } = await getI18n();
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label={t.a11y.settingsNavigation} className="mx-auto w-full max-w-5xl">
        <ActiveNavList items={settingsNav} variant="settings" />
      </nav>
      {children}
    </div>
  );
}
