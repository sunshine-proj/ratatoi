"use client";

import { ChoiceGroup } from "@/components/ui/choice-group";
import { TextField } from "@/components/ui/field";
import { fieldErrorText } from "@/components/forms/field-error";
import { getMessages } from "@/lib/i18n";
import {
  activityLevels,
  sexOptions,
  type ProfileDraft,
  type ProfileErrors,
  type ProfileField,
} from "@/lib/nutrition/estimate";

export function profileFieldIds(prefix: string): { field: ProfileField; id: string }[] {
  return (["age", "sex", "height", "weight", "activity"] as const).map((field) => ({ field, id: `${prefix}-${field}` }));
}

/**
 * Optional body details for the estimate. Each field explains why it is
 * asked. Values live only in component state and are never persisted.
 */
export function ProfileFields({ idPrefix, draft, errors, onChange }: {
  idPrefix: string;
  draft: ProfileDraft;
  errors: ProfileErrors;
  onChange: (draft: ProfileDraft) => void;
}) {
  const t = getMessages();
  const set = <K extends ProfileField>(field: K, value: ProfileDraft[K]) => onChange({ ...draft, [field]: value });
  const common = { autoComplete: "off" } as const;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          id={`${idPrefix}-age`}
          label={t.profile.age.label}
          hint={t.profile.age.why}
          inputMode="numeric"
          value={draft.age}
          onChange={(event) => set("age", event.target.value)}
          error={fieldErrorText(t, errors.age)}
          {...common}
        />
        <TextField
          id={`${idPrefix}-height`}
          label={t.profile.height.label}
          hint={t.profile.height.why}
          inputMode="decimal"
          suffix="cm"
          value={draft.height}
          onChange={(event) => set("height", event.target.value)}
          error={fieldErrorText(t, errors.height)}
          {...common}
        />
        <TextField
          id={`${idPrefix}-weight`}
          label={t.profile.weight.label}
          hint={t.profile.weight.why}
          inputMode="decimal"
          suffix="kg"
          value={draft.weight}
          onChange={(event) => set("weight", event.target.value)}
          error={fieldErrorText(t, errors.weight)}
          {...common}
        />
      </div>

      <ChoiceGroup
        id={`${idPrefix}-sex`}
        type="radio"
        legend={t.profile.sex.legend}
        hint={t.profile.sex.why}
        columns={3}
        value={draft.sex}
        onChange={(value) => set("sex", value)}
        error={fieldErrorText(t, errors.sex, "choice")}
        options={sexOptions.map((value) => ({
          value,
          label: t.profile.sex[value],
          description: value === "unspecified" ? t.profile.sex.unspecifiedHint : undefined,
        }))}
      />

      <ChoiceGroup
        id={`${idPrefix}-activity`}
        type="radio"
        legend={t.profile.activity.legend}
        hint={t.profile.activity.why}
        columns={2}
        value={draft.activity}
        onChange={(value) => set("activity", value)}
        error={fieldErrorText(t, errors.activity, "choice")}
        options={activityLevels.map((value) => ({
          value,
          label: t.profile.activity[value].label,
          description: t.profile.activity[value].description,
        }))}
      />
    </div>
  );
}
