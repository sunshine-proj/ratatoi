import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";
import { getMessages } from "@/lib/i18n";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.preferences.title };

export default function PreferencesPage() {
  return <PagePlaceholder title={t.pages.preferences.title} intro={t.pages.preferences.intro} icon="profile" />;
}
