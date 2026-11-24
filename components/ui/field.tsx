"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

const controlClasses =
  "block w-full min-h-11 rounded-control border bg-surface px-3 text-base text-ink " +
  "placeholder:text-ink-muted disabled:cursor-not-allowed disabled:bg-surface-muted";

type FieldChrome = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
};

/** Wires label, hint, and error to a control with the right ARIA attributes. */
function useFieldIds(id: string | undefined, hint: unknown, error: unknown) {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { controlId, hintId, errorId, describedBy };
}

function FieldMessages({ hint, error, hintId, errorId }: {
  hint?: ReactNode;
  error?: ReactNode;
  hintId?: string;
  errorId?: string;
}) {
  return (
    <>
      {hint ? (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm font-medium text-danger">
          <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> &
  FieldChrome & { type?: "text" | "number" | "email" | "search" | "date" | "password" };

export function TextField({ label, hint, error, id, className, type = "text", ...rest }: TextFieldProps) {
  const { controlId, hintId, errorId, describedBy } = useFieldIds(id, hint, error);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={controlId} className="font-medium">
        {label}
      </label>
      <input
        id={controlId}
        type={type}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={cn(controlClasses, error ? "border-danger" : "border-line-strong")}
        {...rest}
      />
      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & FieldChrome;

export function SelectField({ label, hint, error, id, className, children, ...rest }: SelectFieldProps) {
  const { controlId, hintId, errorId, describedBy } = useFieldIds(id, hint, error);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={controlId} className="font-medium">
        {label}
      </label>
      <div className="relative">
        <select
          id={controlId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(controlClasses, "appearance-none pr-10", error ? "border-danger" : "border-line-strong")}
          {...rest}
        >
          {children}
        </select>
        <Icon
          name="chevronDown"
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-ink-muted"
        />
      </div>
      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
}

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & FieldChrome;

export function Checkbox({ label, hint, error, id, className, ...rest }: CheckboxProps) {
  const { controlId, hintId, errorId, describedBy } = useFieldIds(id, hint, error);
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* The whole row is the label, so the touch target is at least 44 px tall. */}
      <label htmlFor={controlId} className="flex min-h-11 cursor-pointer items-center gap-3">
        <input
          id={controlId}
          type="checkbox"
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className="size-5 shrink-0 cursor-pointer accent-primary"
          {...rest}
        />
        <span>{label}</span>
      </label>
      <div className="pl-8">
        <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
      </div>
    </div>
  );
}
