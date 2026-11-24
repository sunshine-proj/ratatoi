import { addDays, daysBetween, isIsoDate, startOfWeek } from "@/lib/dates";

export const RANGE_MAX_DAYS = 31;

export const rangePresets = ["thisWeek", "nextWeek", "next7", "custom"] as const;
export type RangePreset = (typeof rangePresets)[number];

export type DateRange = { start: string; end: string };

/** Date range for a preset, relative to `today` (weeks run Monday–Sunday). */
export function presetRange(preset: Exclude<RangePreset, "custom">, today: string): DateRange {
  switch (preset) {
    case "thisWeek": {
      const start = startOfWeek(today);
      return { start, end: addDays(start, 6) };
    }
    case "nextWeek": {
      const start = addDays(startOfWeek(today), 7);
      return { start, end: addDays(start, 6) };
    }
    case "next7":
      return { start: today, end: addDays(today, 6) };
  }
}

/** Which preset (if any) a range matches, so a saved list reopens on it. */
export function matchPreset(range: DateRange, today: string): RangePreset {
  for (const preset of ["thisWeek", "nextWeek", "next7"] as const) {
    const candidate = presetRange(preset, today);
    if (candidate.start === range.start && candidate.end === range.end) return preset;
  }
  return "custom";
}

export type RangeError = { code: "invalid" } | { code: "tooLong"; max: number };

export function validateRange(range: DateRange): RangeError | null {
  if (!isIsoDate(range.start) || !isIsoDate(range.end) || range.end < range.start) return { code: "invalid" };
  if (daysBetween(range.start, range.end) + 1 > RANGE_MAX_DAYS) return { code: "tooLong", max: RANGE_MAX_DAYS };
  return null;
}
