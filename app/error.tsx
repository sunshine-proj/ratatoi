"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonClasses } from "@/components/ui/button";
import { getMessages } from "@/lib/i18n";
import { routes } from "@/lib/navigation";

export default function RouteError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = getMessages();

  useEffect(() => {
    // No error reporting service is configured; keep the details out of the UI.
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-6">
      <PageHeader title={t.pages.error.title} intro={t.pages.error.body} />
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => retry()}>{t.pages.error.retry}</Button>
        <Link href={routes.today} className={buttonClasses({ variant: "secondary" })}>
          {t.pages.error.home}
        </Link>
      </div>
    </div>
  );
}
