import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

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
