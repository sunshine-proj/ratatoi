"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/client";
import { formatDate, formatPlural } from "@/lib/i18n/format";

export const DAY_PANEL_ID = "planner-day-panel";
export const dayTabId = (date: string) => `planner-tab-${date}`;

/**
 * Seven day tabs in a fixed grid: they always fit, so narrow screens never
 * scroll sideways. Arrow keys, Home, and End move between days.
 */
export function DayTabs({ dates, selected, today, mealCounts, onSelect }: {
  dates: readonly string[];
  selected: string;
  today: string;
  mealCounts: Record<string, number>;
  onSelect: (date: string) => void;
}) {
  const { t, locale } = useI18n();
  const refs = useRef(new Map<string, HTMLButtonElement>());

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = dates.length - 1;
    const next =
      event.key === "ArrowRight" ? Math.min(last, index + 1)
      : event.key === "ArrowLeft" ? Math.max(0, index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    const date = dates[next]!;
    onSelect(date);
    refs.current.get(date)?.focus();
  }

  return (
    <div role="tablist" aria-label={t.planner.daysLabel} className="grid grid-cols-7 gap-1 rounded-card bg-surface-muted p-1">
      {dates.map((date, index) => {
        const isSelected = date === selected;
        const isToday = date === today;
        const count = mealCounts[date] ?? 0;
        return (
          <button
            key={date}
            ref={(node) => {
              if (node) refs.current.set(date, node);
              else refs.current.delete(date);
            }}
            type="button"
            role="tab"
            id={dayTabId(date)}
            aria-selected={isSelected}
            aria-controls={DAY_PANEL_ID}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(date)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "flex min-h-16 min-w-0 flex-col items-center justify-center gap-0.5 rounded-control px-0.5 py-1.5 transition-colors",
              isSelected ? "bg-primary text-on-primary shadow-card" : "text-ink hover:bg-surface",
            )}
          >
            {/* Visual short labels; the sr-only text below is the tab's full name. */}
            <span aria-hidden="true" className={cn("text-xs", isSelected ? "font-semibold" : "text-ink-muted")}>
              {formatDate(date, "weekdayShort", locale)}
            </span>
            {/* Today: a ring around the date (shape, not just colour). */}
            <span
              aria-hidden="true"
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-pill text-base font-semibold",
                isToday && (isSelected ? "ring-2 ring-on-primary" : "ring-2 ring-primary"),
              )}
            >
              {formatDate(date, "dayOfMonth", locale)}
            </span>
            <span aria-hidden="true" className="flex h-1.5 gap-0.5">
              {Array.from({ length: Math.min(count, 4) }, (_, i) => (
                <span key={i} className={cn("size-1.5 rounded-pill", isSelected ? "bg-on-primary" : "bg-primary")} />
              ))}
            </span>
            <span className="sr-only">
              {formatDate(date, "dayLong", locale)}
              {isToday ? `, ${t.planner.today}` : ""}, {formatPlural(t.planner.dayMeals, count, locale)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
