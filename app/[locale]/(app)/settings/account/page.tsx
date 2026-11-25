import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AccountSettings } from "@/components/settings/account-settings";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pages.account.title };
}

export default async function AccountPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader title={t.pages.account.title} intro={t.pages.account.intro} />
      <AccountSettings />
    </div>
  );
}
