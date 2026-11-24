import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";
import { getMessages } from "@/lib/i18n";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.account.title };

export default function AccountPage() {
  return <PagePlaceholder title={t.pages.account.title} intro={t.pages.account.intro} icon="profile" />;
}
