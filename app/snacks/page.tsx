import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";
import { getMessages } from "@/lib/i18n";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.snacks.title };

export default function SnacksPage() {
  return <PagePlaceholder title={t.pages.snacks.title} intro={t.pages.snacks.intro} icon="snacks" />;
}
