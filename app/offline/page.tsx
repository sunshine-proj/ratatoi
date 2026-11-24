import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { buttonClasses } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/navigation";

const t = getMessages();

export const metadata: Metadata = { title: t.pages.offline.title, robots: { index: false } };

/**
 * Precached by the service worker and served for navigations that fail while
 * offline and have no cached copy. Must stay fully static.
 */
export default function OfflinePage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-6">
      <span className="inline-flex size-14 items-center justify-center rounded-pill bg-surface-muted text-ink">
        <Icon name="offline" className="size-7" />
      </span>
      <PageHeader title={t.pages.offline.title} intro={t.pages.offline.body} />
      {/* A plain link (full navigation) so the browser retries the network. */}
      <a href={routes.today} className={buttonClasses()}>
        {t.pages.offline.retry}
      </a>
    </div>
  );
}
