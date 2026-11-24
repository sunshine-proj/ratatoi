import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { formatMessage, getMessages } from "@/lib/i18n";
import { formatNumber, formatPlural } from "@/lib/i18n/format";
import { routes } from "@/lib/navigation";
import type { DailyTargets } from "@/lib/nutrition/goal";
import { dayProgress, type MetricProgress } from "@/lib/nutrition/progress";
import type { NutritionTotals } from "@/lib/nutrition/totals";

const barTone: Record<MetricProgress["metric"], string> = {
  kcal: "bg-accent",
  proteinG: "bg-primary",
  carbsG: "bg-ink-muted",
  fatG: "bg-ink-muted",
};

/**
 * Planned intake against daily targets. Every bar is decorative: the text
 * beside it says the same thing, so nothing relies on colour or shape alone.
 * There is no red and no "over budget" language; above target is neutral.
 */
export function ProgressPanel({ totals, targets, headingId, heading, headingLevel = 2 }: {
  totals: NutritionTotals;
  targets: DailyTargets | null;
  headingId: string;
  heading: string;
  headingLevel?: 2 | 3;
}) {
  const t = getMessages();
  const p = t.progress;
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card">
      <Heading id={headingId} className="font-sans text-base font-semibold">
        {heading}
      </Heading>

      {targets ? (
        <ul className="flex flex-col gap-4">
          {dayProgress(totals, targets).map((progress) => (
            <ProgressRow key={progress.metric} progress={progress} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="font-medium">
            {formatMessage(t.planner.dayTotals, { kcal: formatNumber(totals.kcal), protein: formatNumber(totals.proteinG) })}
          </p>
          <p className="text-sm text-ink-muted">
            {p.noTargets}{" "}
            <Link href={routes.goals} className="font-medium text-primary underline underline-offset-2">
              {p.setTargets}
            </Link>
          </p>
        </div>
      )}

      {totals.unknownMeals > 0 ? (
        <p className="flex items-start gap-2 text-sm text-ink-muted">
          <Icon name="info" className="mt-0.5 size-4 shrink-0" />
          {formatPlural(t.planner.unknownMeals, totals.unknownMeals)}
        </p>
      ) : null}
      {targets ? <p className="text-xs text-ink-muted">{p.note}</p> : null}
    </section>
  );
}

function ProgressRow({ progress }: { progress: MetricProgress }) {
  const t = getMessages();
  const p = t.progress;
  const { label, unit } = p.metrics[progress.metric];

  if (progress.state === null || progress.displayPlanned === null || progress.displayRemaining === null) {
    return (
      <li className="flex flex-col gap-1">
        <span className="font-medium">{label}</span>
        <span className="text-sm text-ink-muted">{formatMessage(p.unknown, { metric: label.toLocaleLowerCase("en") })}</span>
      </li>
    );
  }

  const status =
    progress.displayRemaining >= 0
      ? formatMessage(p.remaining, { value: formatNumber(progress.displayRemaining), unit })
      : formatMessage(p.above, { value: formatNumber(-progress.displayRemaining), unit });
  const fill = Math.min(1, progress.ratio ?? 0) * 100;

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-medium">{label}</span>
        <span className="text-sm">
          {formatMessage(p.plannedOf, {
            planned: formatNumber(progress.displayPlanned),
            target: formatNumber(progress.target),
            unit,
          })}
        </span>
      </div>
      <div aria-hidden="true" className="relative h-2.5 overflow-hidden rounded-pill bg-surface-muted">
        <div className={cn("h-full rounded-pill transition-[width]", barTone[progress.metric])} style={{ width: `${fill}%` }} />
      </div>
      <span className="flex items-center gap-1.5 text-sm text-ink-muted">
        {progress.state === "met" ? <Icon name="check" className="size-4" /> : null}
        {status}
      </span>
    </li>
  );
}
