"use client";

import { ChoiceGroup } from "@/components/ui/choice-group";
import { fieldErrorText } from "@/components/forms/field-error";
import type { FieldError } from "@/lib/forms/number-field";
import { useI18n } from "@/lib/i18n/client";
import { goalTypes, type GoalType } from "@/lib/nutrition/goal";

export function GoalTypeField({ id, value, onChange, error, hideLegend }: {
  id: string;
  value: GoalType | null;
  onChange: (value: GoalType) => void;
  error?: FieldError;
  hideLegend?: boolean;
}) {
  const { t } = useI18n();
  return (
    <ChoiceGroup
      id={id}
      type="radio"
      legend={t.goalTypes.legend}
      hideLegend={hideLegend}
      value={value}
      onChange={onChange}
      error={fieldErrorText(t, error, "choice")}
      options={goalTypes.map((goal) => ({
        value: goal,
        label: t.goalTypes[goal].label,
        description: t.goalTypes[goal].description,
      }))}
    />
  );
}
