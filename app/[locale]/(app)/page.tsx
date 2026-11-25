import { PageHeader } from "@/components/layout/page-header";
import { TodayDashboard } from "@/components/today/today-dashboard";
import { getI18n } from "@/lib/i18n/server";
import { getRecipeSummaries } from "@/lib/recipes/catalogue";

export default async function TodayPage() {
  const { t, locale } = await getI18n();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title={t.pages.today.title} />
      <TodayDashboard recipes={getRecipeSummaries(locale)} />
    </div>
  );
}
