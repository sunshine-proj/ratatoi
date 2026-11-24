import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";
import { getMessages } from "@/lib/i18n";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.goals.title };

export default function GoalsPage() {
  return <PagePlaceholder title={t.pages.goals.title} intro={t.pages.goals.intro} icon="profile" />;
}
