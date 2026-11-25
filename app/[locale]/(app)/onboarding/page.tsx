import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pages.onboarding.title };
}

export default async function OnboardingPage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <PageHeader title={t.pages.onboarding.title} intro={t.pages.onboarding.intro} />
      <OnboardingWizard />
    </div>
  );
}
