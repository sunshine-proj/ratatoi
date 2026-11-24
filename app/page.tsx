import { PagePlaceholder } from "@/components/layout/page-header";
import { getMessages } from "@/lib/i18n";

export default function TodayPage() {
  const t = getMessages();
  return (
    <>
      <PagePlaceholder title={t.pages.today.title} intro={t.pages.today.intro} icon="today" />
      <p className="mx-auto mt-8 w-full max-w-5xl text-sm text-ink-muted">{t.app.disclaimer}</p>
    </>
  );
}
