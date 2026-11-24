"use client";

import { ChoiceGroup } from "@/components/ui/choice-group";
import { FieldMessages, TextField } from "@/components/ui/field";
import { formatMessage, getMessages } from "@/lib/i18n";
import { formatDateRange } from "@/lib/i18n/format";
import { presetRange, rangePresets, type DateRange, type RangeError, type RangePreset } from "@/lib/shopping/range";

export function RangePicker({ preset, custom, today, error, onPresetChange, onCustomChange }: {
  preset: RangePreset;
  custom: DateRange;
  today: string;
  error: RangeError | null;
  onPresetChange: (preset: RangePreset) => void;
  onCustomChange: (range: DateRange) => void;
}) {
  const t = getMessages();
  const r = t.shopping.range;
  const errorText = error
    ? error.code === "invalid"
      ? r.invalid
      : formatMessage(r.tooLong, { max: error.max })
    : undefined;

  return (
    <div className="flex flex-col gap-3">
      <ChoiceGroup
        id="shopping-range"
        type="radio"
        legend={r.legend}
        columns={2}
        value={preset}
        onChange={onPresetChange}
        options={rangePresets.map((value) => ({
          value,
          label: r[value],
          description:
            value === "custom" ? undefined : formatDateRange(presetRange(value, today).start, presetRange(value, today).end),
        }))}
      />
      {preset === "custom" ? (
        <div className="flex flex-col gap-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              id="shopping-range-from"
              type="date"
              label={r.from}
              value={custom.start}
              onChange={(event) => onCustomChange({ ...custom, start: event.target.value })}
              aria-invalid={error ? true : undefined}
            />
            <TextField
              id="shopping-range-to"
              type="date"
              label={r.to}
              value={custom.end}
              min={custom.start}
              onChange={(event) => onCustomChange({ ...custom, end: event.target.value })}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "shopping-range-error" : undefined}
            />
          </div>
          <FieldMessages error={errorText} errorId="shopping-range-error" />
        </div>
      ) : null}
    </div>
  );
}
