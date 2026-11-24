import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PlannerSkeleton, PlannerView } from "@/components/planner/planner-view";
import { getMessages } from "@/lib/i18n";
import { getRecipeSummaries } from "@/lib/recipes/catalogue";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.planner.title };

export default function PlannerPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader title={t.pages.planner.title} intro={t.pages.planner.intro} />
      {/* The planner reads ?date= from the URL, so it renders in the browser. */}
      <Suspense fallback={<PlannerSkeleton />}>
        <PlannerView recipes={getRecipeSummaries()} />
      </Suspense>
    </div>
  );
}
