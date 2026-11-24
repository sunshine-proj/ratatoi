import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors select-none " +
  "disabled:cursor-not-allowed disabled:opacity-55";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-muted",
  ghost: "text-primary hover:bg-primary-soft",
  danger: "bg-danger text-on-danger hover:brightness-95",
};

// Every size keeps at least a 44×44 px touch target (WCAG 2.5.5 / 2.5.8).
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 min-w-11 px-3 text-sm",
  md: "min-h-11 min-w-11 px-4 text-base",
  lg: "min-h-12 min-w-12 px-6 text-lg",
};

/** Shared classes so links can look like buttons without nesting elements. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant, size, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...rest} />;
}
