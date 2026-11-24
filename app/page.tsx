import { PageHeader } from "@/components/layout/page-header";
import { TodayDashboard } from "@/components/today/today-dashboard";
import { getMessages } from "@/lib/i18n";
import { getRecipeSummaries } from "@/lib/recipes/catalogue";

export default function TodayPage() {
  const t = getMessages();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title={t.pages.today.title} />
      <TodayDashboard recipes={getRecipeSummaries()} />
    </div>
  );
}
