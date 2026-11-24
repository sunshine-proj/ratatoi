import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AccountSettings } from "@/components/settings/account-settings";
import { getMessages } from "@/lib/i18n";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.account.title };

export default function AccountPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader title={t.pages.account.title} intro={t.pages.account.intro} />
      <AccountSettings />
    </div>
  );
}
