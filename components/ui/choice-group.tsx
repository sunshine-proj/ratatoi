"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { FieldMessages } from "./field";

export type ChoiceOption<V extends string> = {
  value: V;
  label: ReactNode;
  description?: ReactNode;
};

type BaseProps<V extends string> = {
  legend: ReactNode;
  /** Visually hide the legend (it is still announced). */
  hideLegend?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  options: readonly ChoiceOption<V>[];
  /** Grid columns from the sm breakpoint up. */
  columns?: 1 | 2 | 3;
  className?: string;
  /** Used to focus the first option, e.g. after a validation error. */
  id?: string;
};

type RadioProps<V extends string> = BaseProps<V> & {
  type: "radio";
  value: V | null;
  onChange: (value: V) => void;
};

type CheckboxProps<V extends string> = BaseProps<V> & {
  type: "checkbox";
  value: readonly V[];
  onChange: (value: V, checked: boolean) => void;
};

const columnClasses = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" } as const;

/**
 * A fieldset of radio buttons or checkboxes rendered as tappable cards.
 * Native inputs keep keyboard behaviour (arrow keys for radios, Space for
 * checkboxes); the selected state shows a border, tint, and a checked input,
 * so it is never conveyed by colour alone.
 */
export function ChoiceGroup<V extends string>(props: RadioProps<V> | CheckboxProps<V>) {
  const { legend, hideLegend, hint, error, options, columns = 1, className, id } = props;
  const baseId = useId();
  const name = id ?? baseId;
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset className={cn("flex flex-col gap-2", className)} aria-describedby={describedBy}>
      <legend className={cn("mb-1 font-medium", hideLegend && "sr-only")}>{legend}</legend>
      {hint || error ? (
        <div className="-mt-1 mb-1 flex flex-col gap-1">
          <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
        </div>
      ) : null}
      <div className={cn("grid gap-2", columnClasses[columns])}>
        {options.map((option, index) => {
          const checked =
            props.type === "radio" ? props.value === option.value : props.value.includes(option.value);
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-11 cursor-pointer items-start gap-3 rounded-control border bg-surface px-3 py-2.5 transition-colors",
                "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                checked ? "border-primary bg-primary-soft" : error ? "border-danger" : "border-line-strong hover:bg-surface-muted",
              )}
            >
              <input
                id={index === 0 ? name : undefined}
                type={props.type}
                name={name}
                value={option.value}
                checked={checked}
                aria-invalid={error ? true : undefined}
                onChange={(event) => {
                  if (props.type === "radio") props.onChange(option.value);
                  else props.onChange(option.value, event.target.checked);
                }}
                // The label carries the visible focus ring.
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary focus-visible:outline-none"
              />
              <span className="flex flex-col">
                <span className={cn(checked && "font-semibold")}>{option.label}</span>
                {option.description ? <span className="text-sm text-ink-muted">{option.description}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
