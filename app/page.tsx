import { PageHeader } from "@/components/layout/page-header";
import { TodayOverview } from "@/components/today/today-overview";
import { getMessages } from "@/lib/i18n";

export default function TodayPage() {
  const t = getMessages();
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader title={t.pages.today.title} intro={t.pages.today.intro} />
      <TodayOverview />
      <p className="text-sm text-ink-muted">{t.app.disclaimer}</p>
    </div>
  );
}
