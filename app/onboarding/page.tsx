import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";
import { getMessages } from "@/lib/i18n";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.onboarding.title };

export default function OnboardingPage() {
  return <PagePlaceholder title={t.pages.onboarding.title} intro={t.pages.onboarding.intro} icon="today" />;
}
