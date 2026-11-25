"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { EstimateResult } from "@/components/goals/estimate-result";
import { GoalTypeField } from "@/components/goals/goal-type-field";
import { ProfileFields, profileFieldIds } from "@/components/goals/profile-fields";
import { TargetsDisclaimer } from "@/components/goals/targets-disclaimer";
import { TargetsFields, targetFieldIds } from "@/components/goals/targets-fields";
import { focusFirstError } from "@/components/forms/field-error";
import { PreferencesFields } from "@/components/preferences/preferences-fields";
import { SettingsGate } from "@/components/settings/settings-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { toLocalIsoDate } from "@/lib/dates";
import type { FieldError } from "@/lib/forms/number-field";
import { formatMessage, localePath } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { routes } from "@/lib/navigation";
import {
  emptyProfileDraft,
  estimateTargets,
  parseProfile,
  type Profile,
  type ProfileDraft,
  type ProfileErrors,
} from "@/lib/nutrition/estimate";
import {
  buildGoal,
  emptyTargetsDraft,
  parseTargets,
  targetsToDraft,
  type GoalType,
  type TargetSource,
  type TargetsDraft,
  type TargetsErrors,
} from "@/lib/nutrition/goal";
import { defaultPreferences, type UserPreferences } from "@/lib/preferences/preferences";
import { completeOnboarding, type UserSettings } from "@/lib/settings/settings";
import { useSettings } from "@/lib/settings/use-settings";
import { PreferencesSummary, TargetsSummary } from "./summaries";

const steps = ["goal", "profile", "targets", "preferences", "summary"] as const;
type StepId = (typeof steps)[number];

export function OnboardingWizard() {
  // Next.js keeps recently visited pages mounted (hidden) with their state.
  // After a successful save, start a fresh wizard the next time this page is
  // shown; an unfinished wizard keeps the user's progress.
  const [session, setSession] = useState(0);
  const finished = useRef(false);
  useLayoutEffect(() => {
    return () => {
      if (finished.current) {
        finished.current = false;
        setSession((n) => n + 1);
      }
    };
  }, []);

  return (
    <SettingsGate>
      {(settings) => (
        <Wizard
          key={session}
          saved={settings}
          onFinished={() => {
            finished.current = true;
          }}
        />
      )}
    </SettingsGate>
  );
}

function Wizard({ saved, onFinished }: { saved: UserSettings | null; onFinished: () => void }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const { update } = useSettings();

  const [step, setStep] = useState<StepId>("goal");
  const [goalType, setGoalType] = useState<GoalType | null>(saved?.goal?.goalType ?? null);
  const [goalError, setGoalError] = useState<FieldError | undefined>();
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  // Only the parsed profile is kept, in memory, so the estimate follows goal changes.
  const [profile, setProfile] = useState<Profile | null>(null);
  const [targets, setTargets] = useState<TargetsDraft>(saved?.goal ? targetsToDraft(saved.goal, locale) : emptyTargetsDraft);
  const [targetErrors, setTargetErrors] = useState<TargetsErrors>({});
  const [targetSource, setTargetSource] = useState<TargetSource>(saved?.goal?.targetSource ?? "manual");
  const [preferences, setPreferences] = useState<UserPreferences>(saved?.preferences ?? defaultPreferences);
  const [saving, setSaving] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    // Move focus to the new step's heading so screen readers announce it.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const index = steps.indexOf(step);
  const goTo = (next: StepId) => setStep(next);
  const back = () => goTo(steps[Math.max(0, index - 1)]!);

  const estimate = profile && goalType ? estimateTargets(profile, goalType) : null;

  function submitGoal() {
    if (!goalType) {
      setGoalError({ code: "required" });
      document.getElementById("onboarding-goal")?.focus();
      return;
    }
    goTo("profile");
  }

  function submitProfile() {
    const result = parseProfile(profileDraft, locale);
    if (!result.ok) {
      setProfileErrors(result.errors);
      setProfile(null);
      focusFirstError(profileFieldIds("onboarding-profile"), result.errors);
      return;
    }
    setProfileErrors({});
    setProfile(result.value);
  }

  function applyEstimate() {
    if (!estimate) return;
    setTargets((current) => ({ ...current, calories: String(estimate.calories), protein: String(estimate.protein) }));
    setTargetErrors({});
    setTargetSource("estimate");
    // No toast: the next step's heading takes focus and the values are visible.
    goTo("targets");
  }

  function submitTargets() {
    const result = parseTargets(targets, locale);
    if (!result.ok) {
      setTargetErrors(result.errors);
      focusFirstError(targetFieldIds("onboarding-targets"), result.errors);
      return;
    }
    setTargetErrors({});
    goTo("preferences");
  }

  function save() {
    const parsedTargets = parseTargets(targets, locale);
    if (!goalType) return goTo("goal");
    if (!parsedTargets.ok) return goTo("targets");

    setSaving(true);
    const goal = buildGoal({
      goalType,
      targets: parsedTargets.value,
      targetSource,
      effectiveFrom: toLocalIsoDate(),
    });
    const result = update((current) => completeOnboarding(current, { goal, preferences }));
    setSaving(false);

    if (!result.ok) {
      toast.show({ message: t.settings.saveFailed, tone: "error", duration: null });
      return;
    }
    toast.show({ message: t.onboarding.saved, tone: "success" });
    onFinished();
    router.push(localePath(locale, routes.today));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === "goal") submitGoal();
    else if (step === "profile") submitProfile();
    else if (step === "targets") submitTargets();
    else if (step === "preferences") goTo("summary");
    else save();
  }

  const stepCopy = t.onboarding.steps[step];
  const parsedForSummary = parseTargets(targets, locale);

  return (
    <div className="flex flex-col gap-6">
      {saved?.onboardingCompletedAt && step === "goal" ? (
        <p className="flex items-start gap-2 rounded-control bg-surface-muted px-4 py-3 text-sm">
          <Icon name="info" className="mt-0.5 size-4 shrink-0" />
          {t.onboarding.existing}
        </p>
      ) : null}

      <Progress current={index + 1} total={steps.length} />

      <form noValidate onSubmit={onSubmit} aria-labelledby="onboarding-step-title" className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h2 id="onboarding-step-title" ref={headingRef} tabIndex={-1} className="text-2xl font-semibold focus:outline-none">
            {stepCopy.title}
          </h2>
          <p className="text-ink-muted">{stepCopy.intro}</p>
        </header>

        {step === "goal" ? (
          <GoalTypeField
            id="onboarding-goal"
            hideLegend
            value={goalType}
            onChange={(value) => {
              setGoalType(value);
              setGoalError(undefined);
            }}
            error={goalError}
          />
        ) : null}

        {step === "profile" ? (
          <>
            <ProfileFields
              idPrefix="onboarding-profile"
              draft={profileDraft}
              errors={profileErrors}
              onChange={(draft) => {
                setProfileDraft(draft);
                setProfile(null);
              }}
            />
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Icon name="info" className="size-4 shrink-0" />
              {t.profile.notSaved}
            </p>
            {estimate ? (
              <EstimateResult
                estimate={estimate}
                headingId="onboarding-estimate-title"
                action={
                  <Button onClick={applyEstimate} className="self-start">
                    {t.estimate.use}
                  </Button>
                }
              />
            ) : null}
          </>
        ) : null}

        {step === "targets" ? (
          <>
            <TargetsFields
              idPrefix="onboarding-targets"
              draft={targets}
              errors={targetErrors}
              onChange={(field, value) => {
                setTargets((current) => ({ ...current, [field]: value }));
                setTargetErrors((current) => ({ ...current, [field]: undefined }));
              }}
            />
            <TargetsDisclaimer />
          </>
        ) : null}

        {step === "preferences" ? (
          <PreferencesFields idPrefix="onboarding-preferences" value={preferences} onChange={setPreferences} />
        ) : null}

        {step === "summary" && goalType && parsedForSummary.ok ? (
          <div className="flex flex-col gap-4">
            <SummaryRow title={t.onboarding.summaryGoal} onEdit={() => goTo("goal")}>
              <p>{t.goalTypes[goalType].label}</p>
            </SummaryRow>
            <SummaryRow title={t.onboarding.summaryTargets} onEdit={() => goTo("targets")}>
              <TargetsSummary targets={parsedForSummary.value} source={targetSource} />
            </SummaryRow>
            <SummaryRow title={t.onboarding.summaryPreferences} onEdit={() => goTo("preferences")}>
              <PreferencesSummary preferences={preferences} />
            </SummaryRow>
            <TargetsDisclaimer />
            <p className="flex items-start gap-2 text-sm text-ink-muted">
              <Icon name="info" className="mt-0.5 size-4 shrink-0" />
              {t.onboarding.deviceNote}
            </p>
          </div>
        ) : null}

        <StepActions
          showBack={index > 0}
          onBack={back}
          primary={
            step === "profile"
              ? profile
                ? t.profile.reestimate
                : t.profile.estimate
              : step === "summary"
                ? t.onboarding.finish
                : t.onboarding.next
          }
          primaryVariant={step === "profile" && estimate ? "secondary" : "primary"}
          busy={saving}
          extra={
            step === "profile" ? (
              <Button variant="ghost" onClick={() => goTo("targets")}>
                {t.profile.skip}
              </Button>
            ) : null
          }
        />
      </form>
    </div>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  const { t } = useI18n();
  const label = formatMessage(t.onboarding.stepOf, { current, total });
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <div
        role="progressbar"
        aria-label={t.onboarding.progressLabel}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={label}
        className="h-2 w-full overflow-hidden rounded-pill bg-surface-muted"
      >
        <div className="h-full rounded-pill bg-primary transition-[width]" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

function StepActions({ showBack, onBack, primary, primaryVariant, busy, extra }: {
  showBack: boolean;
  onBack: () => void;
  primary: string;
  primaryVariant: "primary" | "secondary";
  busy: boolean;
  extra?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
      {showBack ? (
        <Button variant="secondary" onClick={onBack}>
          {t.onboarding.back}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {extra}
        <Button type="submit" variant={primaryVariant} disabled={busy} className={cn(primaryVariant === "primary" && "sm:min-w-40")}>
          {primary}
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <Card as="section" className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="font-sans text-base font-semibold">{title}</h3>
        {children}
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`${t.common.edit}: ${title}`}>
        {t.common.edit}
      </Button>
    </Card>
  );
}
