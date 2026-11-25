"use client";

import { Link } from "@/components/ui/link";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { isActivePath, type NavItem } from "@/lib/navigation";
import { Icon } from "@/components/ui/icon";

export type NavVariant = "bottom" | "sidebar" | "settings";

type NavListProps = {
  items: readonly NavItem[];
  variant: NavVariant;
  /** Current path, or null while it is unknown (prerender fallback). */
  pathname: string | null;
};

const itemClasses: Record<NavVariant, { base: string; active: string; idle: string }> = {
  bottom: {
    base: "relative flex min-h-[var(--spacing-bottom-nav)] flex-1 flex-col items-center justify-center gap-0.5 text-xs",
    // Active: colour + bold label + top indicator bar (not colour alone).
    active:
      "font-semibold text-primary before:absolute before:inset-x-5 before:top-0 before:h-1 before:rounded-b-full before:bg-primary",
    idle: "text-ink-muted hover:text-ink",
  },
  sidebar: {
    base: "flex min-h-11 items-center gap-3 rounded-control px-3 text-base",
    active: "bg-primary-soft font-semibold text-primary-strong",
    idle: "text-ink-muted hover:bg-surface-muted hover:text-ink",
  },
  settings: {
    base: "inline-flex min-h-11 items-center rounded-pill border px-4 text-sm whitespace-nowrap",
    active: "border-primary bg-primary-soft font-semibold text-primary-strong",
    idle: "border-line-strong bg-surface text-ink hover:bg-surface-muted",
  },
};

/**
 * Renders navigation links and marks the current page with
 * `aria-current="page"`. Pure: the caller supplies the pathname.
 */
export function NavList({ items, variant, pathname }: NavListProps) {
  const { t } = useI18n();
  const styles = itemClasses[variant];
  return (
    <ul
      className={cn(
        variant === "bottom" && "flex",
        variant === "sidebar" && "flex flex-col gap-1",
        variant === "settings" && "flex gap-2 overflow-x-auto pb-1",
      )}
    >
      {items.map((item) => {
        const active = pathname !== null && isActivePath(pathname, item);
        return (
          <li key={item.href} className={cn(variant === "bottom" && "flex flex-1")}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(styles.base, active ? styles.active : styles.idle)}
            >
              {variant === "settings" ? null : (
                <Icon name={item.icon} className={variant === "bottom" ? "size-6" : "size-5"} />
              )}
              <span>{t.nav[item.label]}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
