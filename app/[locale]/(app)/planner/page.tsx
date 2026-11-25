import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PlannerSkeleton, PlannerView } from "@/components/planner/planner-view";
import { getI18n } from "@/lib/i18n/server";
import { getRecipeSummaries } from "@/lib/recipes/catalogue";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pages.planner.title };
}

export default async function PlannerPage() {
  const { t, locale } = await getI18n();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader title={t.pages.planner.title} intro={t.pages.planner.intro} />
      {/* The planner reads ?date= from the URL, so it renders in the browser. */}
      <Suspense fallback={<PlannerSkeleton />}>
        <PlannerView recipes={getRecipeSummaries(locale)} />
      </Suspense>
    </div>
  );
}
