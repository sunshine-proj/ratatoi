"use client";

import Link from "next/link";
import { TargetsSummary } from "@/components/onboarding/summaries";
import { SettingsGate } from "@/components/settings/settings-gate";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/navigation";

/** Today: set-up prompt for new users, or their daily targets. */
export function TodayOverview() {
  const t = getMessages();
  return (
    <SettingsGate>
      {(settings) => {
        if (!settings?.onboardingCompletedAt && !settings?.goal) {
          return (
            <Card as="section" aria-labelledby="today-setup-title" className="flex flex-col items-start gap-3">
              <span className="inline-flex size-12 items-center justify-center rounded-pill bg-primary-soft text-primary-strong">
                <Icon name="today" />
              </span>
              <h2 id="today-setup-title" className="text-2xl font-semibold">
                {t.pages.today.setupTitle}
              </h2>
              <p className="text-ink-muted">{t.pages.today.setupBody}</p>
              <Link href={routes.onboarding} className={buttonClasses({ size: "lg" })}>
                {t.pages.today.setupCta}
              </Link>
            </Card>
          );
        }

        return (
          <Card as="section" aria-labelledby="today-targets-title" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="today-targets-title" className="text-xl font-semibold">
                {t.pages.today.targetsTitle}
              </h2>
              <Link href={routes.goals} className={buttonClasses({ variant: "ghost", size: "sm" })}>
                {settings.goal ? t.pages.today.editTargets : t.pages.today.addTargets}
              </Link>
            </div>
            {settings.goal ? (
              <TargetsSummary targets={settings.goal} />
            ) : (
              <p className="text-ink-muted">{t.pages.today.noTargets}</p>
            )}
          </Card>
        );
      }}
    </SettingsGate>
  );
}
