import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { getMessages } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";

export function PageHeader({ title, intro, className }: {
  title: ReactNode;
  intro?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex max-w-2xl flex-col gap-2", className)}>
      <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
      {intro ? <p className="text-lg text-ink-muted">{intro}</p> : null}
    </header>
  );
}

/** Temporary body for routes whose feature is scheduled in a later phase. */
export function ComingSoon({ icon }: { icon: IconName }) {
  const t = getMessages();
  return (
    <Card className="mt-8 flex max-w-2xl items-center gap-4">
      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-pill bg-primary-soft text-primary-strong">
        <Icon name={icon} />
      </span>
      <p>{t.common.comingSoon}</p>
    </Card>
  );
}

export function PagePlaceholder({ title, intro, icon }: {
  title: ReactNode;
  intro: ReactNode;
  icon: IconName;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader title={title} intro={intro} />
      <ComingSoon icon={icon} />
    </div>
  );
}
