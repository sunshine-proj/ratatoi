import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/navigation";
import { cn } from "@/lib/cn";

/** The plate-and-leaf mark, shared with the app icon artwork in assets/. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={cn("size-8", className)}>
      <rect width="48" height="48" rx="12" fill="var(--color-primary)" />
      <circle cx="24" cy="24" r="15" fill="#fbf7f0" />
      <circle cx="24" cy="24" r="10.5" fill="none" stroke="#e2efe5" strokeWidth="2" />
      <path d="M17 29c0-8 6-12.5 14-12.5 0 8-5 13-14 12.5Z" fill="var(--color-primary)" />
      <path d="M18.5 28.5c3-3.2 6.2-5.6 10-7.3" stroke="#fbf7f0" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="31" cy="30" r="3" fill="var(--color-accent)" />
    </svg>
  );
}

export function BrandLink({ className }: { className?: string }) {
  const t = getMessages();
  return (
    <Link
      href={routes.today}
      aria-label={t.a11y.home}
      className={cn("inline-flex min-h-11 items-center gap-2.5 rounded-control", className)}
    >
      <BrandMark />
      <span className="font-display text-lg font-semibold tracking-tight">{t.app.name}</span>
    </Link>
  );
}
