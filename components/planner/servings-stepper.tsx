"use client";

import { useId } from "react";
import { formatMessage, getMessages } from "@/lib/i18n";
import { formatPlural } from "@/lib/i18n/format";
import { SERVINGS_MAX, SERVINGS_MIN } from "@/lib/planner/schema";
import { formatQuantity } from "@/lib/recipes/format";
import { Icon } from "@/components/ui/icon";

/**
 * Next servings value: quarter steps up to 1 (¼, ½, ¾, 1), half steps above
 * (1½, 2, 2½…), clamped to the allowed range.
 */
export function nextServings(current: number, direction: 1 | -1): number {
  const step = current < 1 || (current === 1 && direction === -1) ? 0.25 : 0.5;
  const next = Math.round((current + direction * step) * 4) / 4;
  return Math.min(SERVINGS_MAX, Math.max(SERVINGS_MIN, next));
}

export function ServingsStepper({ value, onChange, itemName, label }: {
  value: number;
  onChange: (value: number) => void;
  /** Used in the buttons' accessible names, e.g. "More servings of Chilli". */
  itemName?: string;
  /** Visible label; omit when the context makes it obvious. */
  label?: string;
}) {
  const t = getMessages();
  const id = useId();
  const valueText = formatPlural(t.planner.servings, value, { count: formatQuantity(value) });
  const fewerLabel = itemName ? formatMessage(t.planner.fewer, { name: itemName }) : t.planner.fewerPlain;
  const moreLabel = itemName ? formatMessage(t.planner.more, { name: itemName }) : t.planner.morePlain;

  return (
    <div role="group" aria-labelledby={label ? `${id}-label` : undefined} aria-label={label ? undefined : t.planner.servingsLabel} className="flex flex-col gap-1">
      {label ? (
        <span id={`${id}-label`} className="font-medium">
          {label}
        </span>
      ) : null}
      <div className="inline-flex items-center rounded-control border border-line-strong bg-surface">
        <button
          type="button"
          onClick={() => onChange(nextServings(value, -1))}
          disabled={value <= SERVINGS_MIN}
          aria-label={fewerLabel}
          className="inline-flex size-11 items-center justify-center rounded-l-control text-ink hover:bg-surface-muted disabled:opacity-40"
        >
          <span aria-hidden="true" className="text-xl leading-none">−</span>
        </button>
        <output aria-live="polite" className="min-w-24 px-2 text-center text-sm font-semibold">
          {valueText}
        </output>
        <button
          type="button"
          onClick={() => onChange(nextServings(value, 1))}
          disabled={value >= SERVINGS_MAX}
          aria-label={moreLabel}
          className="inline-flex size-11 items-center justify-center rounded-r-control text-ink hover:bg-surface-muted disabled:opacity-40"
        >
          <Icon name="plus" className="size-5" />
        </button>
      </div>
    </div>
  );
}
