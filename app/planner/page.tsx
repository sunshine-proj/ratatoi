import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";
import { getMessages } from "@/lib/i18n";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.planner.title };

export default function PlannerPage() {
  return <PagePlaceholder title={t.pages.planner.title} intro={t.pages.planner.intro} icon="plan" />;
}
