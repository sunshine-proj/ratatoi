import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getMessages } from "@/lib/i18n";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.onboarding.title };

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <PageHeader title={t.pages.onboarding.title} intro={t.pages.onboarding.intro} />
      <OnboardingWizard />
    </div>
  );
}
