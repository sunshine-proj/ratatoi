"use client";

import { TextField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { fieldErrorText } from "@/components/forms/field-error";
import { formatMessage } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { formatNumber } from "@/lib/i18n/format";
import {
  parseTargets,
  targetNotices,
  type TargetsDraft,
  type TargetsErrors,
  type TargetsField,
} from "@/lib/nutrition/goal";

export function targetFieldIds(prefix: string): { field: TargetsField; id: string }[] {
  return (["calories", "protein", "carbs", "fat"] as const).map((field) => ({ field, id: `${prefix}-${field}` }));
}

export function TargetsFields({ idPrefix, draft, errors, onChange }: {
  idPrefix: string;
  draft: TargetsDraft;
  errors: TargetsErrors;
  onChange: (field: TargetsField, value: string) => void;
}) {
  const { t, locale } = useI18n();
  const parsed = parseTargets(draft, locale);
  const notices = parsed.ok ? targetNotices(parsed.value) : null;
  const showOptional = Boolean(draft.carbs || draft.fat || errors.carbs || errors.fat);

  const numberProps = { inputMode: "numeric" as const, autoComplete: "off", enterKeyHint: "next" as const };

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="sr-only">{t.targets.legend}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id={`${idPrefix}-calories`}
          label={t.targets.calories.label}
          hint={t.targets.calories.hint}
          suffix={t.targets.calories.unit}
          value={draft.calories}
          onChange={(event) => onChange("calories", event.target.value)}
          error={fieldErrorText(t, errors.calories)}
          required
          {...numberProps}
        />
        <TextField
          id={`${idPrefix}-protein`}
          label={t.targets.protein.label}
          hint={t.targets.protein.hint}
          suffix={t.targets.protein.unit}
          value={draft.protein}
          onChange={(event) => onChange("protein", event.target.value)}
          error={fieldErrorText(t, errors.protein)}
          required
          {...numberProps}
        />
      </div>

      <details open={showOptional || undefined} className="group rounded-control border border-line bg-surface">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-control px-3 font-medium [&::-webkit-details-marker]:hidden">
          <span>{t.targets.optionalMacros}</span>
          <Icon name="chevronDown" className="size-5 shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="flex flex-col gap-4 px-3 pt-1 pb-4">
          <p className="text-sm text-ink-muted">{t.targets.optionalMacrosHint}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id={`${idPrefix}-carbs`}
              label={t.targets.carbs.label}
              suffix={t.targets.carbs.unit}
              value={draft.carbs}
              onChange={(event) => onChange("carbs", event.target.value)}
              error={fieldErrorText(t, errors.carbs)}
              {...numberProps}
            />
            <TextField
              id={`${idPrefix}-fat`}
              label={t.targets.fat.label}
              suffix={t.targets.fat.unit}
              value={draft.fat}
              onChange={(event) => onChange("fat", event.target.value)}
              error={fieldErrorText(t, errors.fat)}
              {...numberProps}
            />
          </div>
        </div>
      </details>

      {notices?.lowCalories || notices?.macroEnergyOverCalories ? (
        <ul className="flex flex-col gap-2">
          {notices.lowCalories ? <Notice>{t.targets.lowCalorieNotice}</Notice> : null}
          {notices.macroEnergyOverCalories ? (
            <Notice>
              {formatMessage(t.targets.macroEnergyNotice, { kcal: formatNumber(notices.macroEnergyOverCalories, locale) })}
            </Notice>
          ) : null}
        </ul>
      ) : null}
    </fieldset>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 rounded-control bg-surface-muted px-3 py-2 text-sm">
      <Icon name="info" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
