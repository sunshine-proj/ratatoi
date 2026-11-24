"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { focusFirstError } from "@/components/forms/field-error";
import { SettingsGate } from "@/components/settings/settings-gate";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { toLocalIsoDate } from "@/lib/dates";
import type { FieldError } from "@/lib/forms/number-field";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/navigation";
import { emptyProfileDraft, estimateTargets, parseProfile, type Profile, type ProfileDraft, type ProfileErrors } from "@/lib/nutrition/estimate";
import {
  buildGoal,
  parseTargets,
  targetsToDraft,
  type GoalType,
  type NutritionGoal,
  type TargetSource,
  type TargetsDraft,
  type TargetsErrors,
} from "@/lib/nutrition/goal";
import { withGoal } from "@/lib/settings/settings";
import { useSettings } from "@/lib/settings/use-settings";
import { EstimateResult } from "./estimate-result";
import { GoalTypeField } from "./goal-type-field";
import { ProfileFields, profileFieldIds } from "./profile-fields";
import { TargetsDisclaimer } from "./targets-disclaimer";
import { TargetsFields, targetFieldIds } from "./targets-fields";

export function GoalsSettings() {
  // Keyed by the saved goal: if it changes elsewhere (e.g. onboarding) while
  // this page is kept alive in the background, the form re-initialises instead
  // of showing, and possibly re-saving, stale values.
  return (
    <SettingsGate>
      {(settings) => <GoalsForm key={settings?.goal?.updatedAt ?? "none"} goal={settings?.goal ?? null} />}
    </SettingsGate>
  );
}

function GoalsForm({ goal }: { goal: NutritionGoal | null }) {
  const t = getMessages();
  const toast = useToast();
  const { update } = useSettings();

  const [goalType, setGoalType] = useState<GoalType | null>(goal?.goalType ?? null);
  const [goalError, setGoalError] = useState<FieldError | undefined>();
  const [targets, setTargets] = useState<TargetsDraft>(targetsToDraft(goal));
  const [errors, setErrors] = useState<TargetsErrors>({});
  const [source, setSource] = useState<TargetSource>(goal?.targetSource ?? "manual");
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseTargets(targets);
    setGoalError(goalType ? undefined : { code: "required" });
    setErrors(parsed.ok ? {} : parsed.errors);

    if (!goalType) {
      document.getElementById("goals-type")?.focus();
      return;
    }
    if (!parsed.ok) {
      focusFirstError(targetFieldIds("goals-targets"), parsed.errors);
      return;
    }

    const result = update((current) =>
      withGoal(
        current,
        buildGoal({ goalType, targets: parsed.value, targetSource: source, effectiveFrom: toLocalIsoDate() }),
      ),
    );
    toast.show(
      result.ok
        ? { message: t.settings.goalsSaved, tone: "success" }
        : { message: t.settings.saveFailed, tone: "error", duration: null },
    );
  }

  function clearTargets() {
    const result = update((current) => withGoal(current, null));
    setConfirmClear(false);
    if (!result.ok) {
      toast.show({ message: t.settings.saveFailed, tone: "error", duration: null });
      return;
    }
    setGoalType(null);
    setTargets(targetsToDraft(null));
    setErrors({});
    setSource("manual");
    toast.show({ message: t.settings.cleared, tone: "success" });
  }

  return (
    <>
      {goal ? null : (
        <div className="mb-6 flex flex-col items-start gap-3 rounded-control bg-surface-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2">
            <Icon name="info" className="mt-0.5 size-5 shrink-0" />
            {t.settings.noGoal}
          </p>
          <Link href={routes.onboarding} className={buttonClasses({ variant: "secondary", size: "sm" })}>
            {t.settings.startSetup}
          </Link>
        </div>
      )}

      <form noValidate onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-8">
        <GoalTypeField
          id="goals-type"
          value={goalType}
          onChange={(value) => {
            setGoalType(value);
            setGoalError(undefined);
          }}
          error={goalError}
        />

        <section aria-labelledby="goals-targets-title" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="goals-targets-title" className="text-xl font-semibold">
              {t.targets.legend}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setEstimateOpen(true)}>
              {t.settings.estimateOpen}
            </Button>
          </div>
          <TargetsFields
            idPrefix="goals-targets"
            draft={targets}
            errors={errors}
            onChange={(field, value) => {
              setTargets((current) => ({ ...current, [field]: value }));
              setErrors((current) => ({ ...current, [field]: undefined }));
            }}
          />
          <TargetsDisclaimer />
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-between">
          {goal ? (
            <Button variant="secondary" onClick={() => setConfirmClear(true)}>
              {t.settings.clear}
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" className="sm:min-w-40">
            {t.common.save}
          </Button>
        </div>
      </form>

      <EstimateDialog
        open={estimateOpen}
        goalType={goalType ?? "healthy_eating"}
        onClose={() => setEstimateOpen(false)}
        onApply={(calories, protein) => {
          setTargets((current) => ({ ...current, calories: String(calories), protein: String(protein) }));
          setErrors({});
          setSource("estimate");
          setEstimateOpen(false);
          toast.show({ message: t.estimate.applied, tone: "info" });
        }}
      />

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title={t.settings.clearTitle}
        description={t.settings.clearBody}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmClear(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" onClick={clearTargets}>
              {t.settings.clear}
            </Button>
          </>
        }
      />
    </>
  );
}

/** Profile details live only inside this dialog and are dropped when it closes. */
function EstimateDialog({ open, goalType, onClose, onApply }: {
  open: boolean;
  goalType: GoalType;
  onClose: () => void;
  onApply: (calories: number, protein: number) => void;
}) {
  const t = getMessages();
  const [draft, setDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [profile, setProfile] = useState<Profile | null>(null);
  const estimate = profile ? estimateTargets(profile, goalType) : null;

  function close() {
    setDraft(emptyProfileDraft);
    setErrors({});
    setProfile(null);
    onClose();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseProfile(draft);
    if (!result.ok) {
      setErrors(result.errors);
      setProfile(null);
      focusFirstError(profileFieldIds("estimate-profile"), result.errors);
      return;
    }
    setErrors({});
    setProfile(result.value);
  }

  return (
    <Dialog open={open} onClose={close} variant="sheet" title={t.settings.estimateDialogTitle} description={t.profile.intro} className="max-w-2xl">
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <ProfileFields
          idPrefix="estimate-profile"
          draft={draft}
          errors={errors}
          onChange={(next) => {
            setDraft(next);
            setProfile(null);
          }}
        />
        <Button type="submit" variant={estimate ? "secondary" : "primary"} className="self-start">
          {estimate ? t.profile.reestimate : t.profile.estimate}
        </Button>
        {estimate ? (
          <EstimateResult
            estimate={estimate}
            headingId="estimate-dialog-result"
            action={
              <Button
                className="self-start"
                onClick={() => {
                  onApply(estimate.calories, estimate.protein);
                  setDraft(emptyProfileDraft);
                  setProfile(null);
                }}
              >
                {t.estimate.use}
              </Button>
            }
          />
        ) : null}
      </form>
    </Dialog>
  );
}
