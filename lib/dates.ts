/**
 * Calendar dates.
 *
 * Plans are stored as plain local calendar dates (`YYYY-MM-DD`): "the user's
 * Thursday", with no time or timezone. "Today" comes from the device's local
 * clock. Arithmetic on these strings uses UTC internally so daylight-saving
 * changes can never shift a date. Weeks start on Monday (ISO 8601, the EU
 * convention).
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

/** Today's calendar date in the user's own timezone, as `YYYY-MM-DD`. */
export function toLocalIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whether a string is a real calendar date in `YYYY-MM-DD` form. */
export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Midnight UTC for a calendar date. Use only for arithmetic and formatting with timeZone "UTC". */
export function isoDateToUtc(iso: string): Date {
  if (!isIsoDate(iso)) throw new Error(`Invalid ISO date: ${iso}`);
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

function utcToIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return utcToIsoDate(new Date(isoDateToUtc(iso).getTime() + days * MS_PER_DAY));
}

/** The Monday on or before the given date. */
export function startOfWeek(iso: string): string {
  const weekday = isoDateToUtc(iso).getUTCDay(); // 0 = Sunday
  return addDays(iso, -((weekday + 6) % 7));
}

/** The seven dates (Monday to Sunday) of the week containing `iso`. */
export function weekDates(iso: string): string[] {
  const monday = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Whole days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a: string, b: string): number {
  return Math.round((isoDateToUtc(b).getTime() - isoDateToUtc(a).getTime()) / MS_PER_DAY);
}
