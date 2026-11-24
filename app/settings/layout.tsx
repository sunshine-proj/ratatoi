import { ActiveNavList } from "@/components/layout/active-nav-list";
import { getMessages } from "@/lib/i18n";
import { settingsNav } from "@/lib/navigation";

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  const t = getMessages();
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label={t.a11y.settingsNavigation} className="mx-auto w-full max-w-5xl">
        <ActiveNavList items={settingsNav} variant="settings" />
      </nav>
      {children}
    </div>
  );
}
