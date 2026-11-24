"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DocumentGate } from "@/components/storage/document-gate";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { addDays, isIsoDate, toLocalIsoDate, weekDates } from "@/lib/dates";
import { formatMessage, getMessages } from "@/lib/i18n";
import { formatDate, formatDateRange, formatPlural } from "@/lib/i18n/format";
import { clearDates, countMealsOn } from "@/lib/planner/operations";
import { emptyPlan, type MealPlan } from "@/lib/planner/schema";
import type { RecipeSummary } from "@/lib/recipes/catalogue";
import { AddMealDialog, type AddMealTarget } from "./add-meal-dialog";
import { DayPlan } from "./day-plan";
import { focusSlotAddButton } from "./slot-focus";
import { DayTabs } from "./day-tabs";
import { DuplicateMealDialog } from "./duplicate-meal-dialog";
import { RecipeLookupProvider } from "./recipe-lookup";
import { SwapMealDialog } from "./swap-meal-dialog";
import { usePlanActions } from "./use-plan-actions";
import { WeekSummary } from "./week-summary";
import { useSettings } from "@/lib/settings/use-settings";

/**
 * Week planner. The selected day lives in the URL (`?date=YYYY-MM-DD`) so
 * refresh, back/forward, and "View plan" links land on the right day.
 */
export function PlannerView({ recipes }: { recipes: RecipeSummary[] }) {
  const t = getMessages();
  const { state, reset } = usePlanActions();
  return (
    <RecipeLookupProvider recipes={recipes}>
      <DocumentGate
        state={state}
        reset={reset}
        loading={<PlannerSkeleton />}
        copy={{
          title: t.planner.loadFailedTitle,
          body: t.planner.loadFailedBody,
          reset: t.planner.reset,
          resetDone: t.planner.resetDone,
        }}
      >
        {(plan) => <Planner plan={plan ?? emptyPlan} />}
      </DocumentGate>
    </RecipeLookupProvider>
  );
}

export function PlannerSkeleton() {
  const t = getMessages();
  return (
    <div aria-busy="true" className="flex flex-col gap-4 motion-safe:animate-pulse">
      <p role="status" className="sr-only">
        {t.planner.loading}
      </p>
      <div aria-hidden="true" className="h-11 w-full rounded-control bg-surface-muted" />
      <div aria-hidden="true" className="h-20 w-full rounded-card bg-surface-muted" />
      <div aria-hidden="true" className="h-40 w-full rounded-card bg-surface-muted" />
    </div>
  );
}

type Confirm = { kind: "day"; date: string } | { kind: "week" } | null;

function Planner({ plan }: { plan: MealPlan }) {
  const t = getMessages();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { apply } = usePlanActions();
  const { state: settings } = useSettings();
  const targets = settings.status === "ready" ? settings.value.goal : null;

  const today = toLocalIsoDate();
  const requested = searchParams.get("date");
  const selected = requested && isIsoDate(requested) ? requested : today;
  const week = weekDates(selected);

  const [addTarget, setAddTarget] = useState<AddMealTarget | null>(null);
  const [swapId, setSwapId] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const select = (date: string) => router.replace(`${pathname}?date=${date}`, { scroll: false });
  const mealCounts = Object.fromEntries(week.map((date) => [date, countMealsOn(plan, [date])]));
  const weekCount = countMealsOn(plan, week);
  const range = formatDateRange(week[0]!, week[6]!);

  function clear() {
    if (!confirm) return;
    const dates = confirm.kind === "day" ? [confirm.date] : week;
    const ok = apply((current) => clearDates(current, dates));
    setConfirm(null);
    if (ok) toast.show({ message: confirm.kind === "day" ? t.planner.clearedDay : t.planner.clearedWeek, tone: "success" });
  }

  const confirmCount = confirm ? countMealsOn(plan, confirm.kind === "day" ? [confirm.date] : week) : 0;

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label={formatMessage(t.planner.weekRange, { range })} className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => select(addDays(week[0]!, -7))} aria-label={t.planner.previousWeek}>
            <Icon name="chevronLeft" className="size-5" />
          </Button>
          <p className="min-w-40 text-center font-semibold" aria-live="polite">
            {range}
          </p>
          <Button variant="ghost" size="sm" onClick={() => select(addDays(week[0]!, 7))} aria-label={t.planner.nextWeek}>
            <Icon name="chevronRight" className="size-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {!week.includes(today) ? (
            <Button variant="secondary" size="sm" onClick={() => select(today)}>
              {t.planner.thisWeek}
            </Button>
          ) : null}
          {weekCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setConfirm({ kind: "week" })}>
              {t.planner.clearWeek}
            </Button>
          ) : null}
        </div>
      </nav>

      <DayTabs dates={week} selected={selected} today={today} mealCounts={mealCounts} onSelect={select} />

      <WeekSummary plan={plan} week={week} targets={targets} />

      <DayPlan
        plan={plan}
        date={selected}
        today={today}
        targets={targets}
        onAdd={(mealType) => setAddTarget({ date: selected, mealType })}
        onSwap={setSwapId}
        onDuplicate={setDuplicateId}
        onClearDay={() => setConfirm({ kind: "day", date: selected })}
      />

      <AddMealDialog
        target={addTarget}
        onClose={() => {
          if (addTarget) focusSlotAddButton(addTarget.date, addTarget.mealType);
          setAddTarget(null);
        }}
      />
      <SwapMealDialog mealId={swapId} onClose={() => setSwapId(null)} />
      <DuplicateMealDialog mealId={duplicateId} onClose={() => setDuplicateId(null)} />
      <Dialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={
          confirm?.kind === "day"
            ? formatMessage(t.planner.clearDayTitle, { day: formatDate(confirm.date, "dayShort") })
            : t.planner.clearWeekTitle
        }
        description={
          confirm?.kind === "day"
            ? formatPlural(t.planner.clearDayBody, confirmCount, { day: formatDate(confirm.date, "dayShort") })
            : formatPlural(t.planner.clearWeekBody, confirmCount, { range })
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" onClick={clear}>
              {confirm?.kind === "day" ? t.planner.clearDay : t.planner.clearWeek}
            </Button>
          </>
        }
      />
    </div>
  );
}
