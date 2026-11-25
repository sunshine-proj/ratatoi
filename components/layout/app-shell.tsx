import Link from "next/link";
import type { ReactNode } from "react";
import { getMessages } from "@/lib/i18n";
import { primaryNav, profileNavItem, routes, sidebarNav } from "@/lib/navigation";
import { ActiveNavList } from "./active-nav-list";
import { BrandLink } from "./brand";
import { OfflineIndicator } from "./offline-indicator";
import { Icon } from "@/components/ui/icon";

/**
 * Responsive shell.
 * - Phones: top bar (brand + profile), content, fixed bottom tab bar.
 * - md and up: left sidebar with all destinations; no bottom bar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const t = getMessages();

  return (
    <>
      <a
        href="#main"
        className="fixed top-2 left-2 z-[60] -translate-y-24 rounded-control bg-primary px-4 py-3 font-medium text-on-primary shadow-raised focus:translate-y-0"
      >
        {t.a11y.skipToContent}
      </a>

      <div className="md:grid md:min-h-dvh md:grid-cols-[var(--spacing-sidebar)_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:gap-6 md:border-r md:border-line md:bg-surface md:px-4 md:py-5">
          <BrandLink className="px-2" />
          <nav aria-label={t.a11y.primaryNavigation} className="flex flex-1 flex-col justify-between gap-6">
            <ActiveNavList items={sidebarNav} variant="sidebar" />
            <ActiveNavList items={[profileNavItem]} variant="sidebar" />
          </nav>
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
            <BrandLink />
            <Link
              href={profileNavItem.href}
              aria-label={t.nav.profile}
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-control text-ink hover:bg-surface-muted"
            >
              <Icon name="profile" />
            </Link>
          </header>

          <OfflineIndicator />

          <main
            id="main"
            tabIndex={-1}
            className="flex w-full flex-1 flex-col px-4 pt-6 pb-[calc(var(--spacing-bottom-nav)+env(safe-area-inset-bottom)+1.5rem)] focus:outline-none sm:px-6 md:px-8 md:pt-10 md:pb-12"
          >
            {/*
              At least one screen tall, so the footer always starts below the
              first view. Content rendered in the browser (plan, list, progress)
              then grows without moving anything visible: no layout shift.
            */}
            <div className="flex min-h-dvh flex-col">{children}</div>
            <footer aria-label={t.footer.label} className="mx-auto mt-auto w-full max-w-5xl pt-12">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-sm text-ink-muted">
                <span>{t.app.disclaimer}</span>
                <Link href={routes.privacy} className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-2">
                  {t.footer.privacy}
                </Link>
              </div>
            </footer>
          </main>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label={t.a11y.primaryNavigation}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ActiveNavList items={primaryNav} variant="bottom" />
      </nav>
    </>
  );
}
