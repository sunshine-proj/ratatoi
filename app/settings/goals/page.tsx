import type { Metadata } from "next";
import { GoalsSettings } from "@/components/goals/goals-settings";
import { PageHeader } from "@/components/layout/page-header";
import { getMessages } from "@/lib/i18n";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.goals.title };

export default function GoalsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader title={t.pages.goals.title} intro={t.pages.goals.intro} />
      <GoalsSettings />
    </div>
  );
}
