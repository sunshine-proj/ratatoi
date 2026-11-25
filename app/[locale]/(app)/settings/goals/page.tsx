import type { Metadata } from "next";
import { GoalsSettings } from "@/components/goals/goals-settings";
import { PageHeader } from "@/components/layout/page-header";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pages.goals.title };
}

export default async function GoalsPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader title={t.pages.goals.title} intro={t.pages.goals.intro} />
      <GoalsSettings />
    </div>
  );
}
