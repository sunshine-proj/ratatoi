import { isoDateToUtc } from "@/lib/dates";
import { defaultLocale, formatMessage, type Locale } from "./index";

/**
 * Intl locale per app locale. English uses en-GB conventions (day before
 * month, 24-hour time), matching the app's EU defaults.
 */
const intlLocales: Record<Locale, string> = { en: "en-GB" };

const formatters = new Map<string, Intl.NumberFormat>();

/** Locale-aware number formatting, e.g. 1900 → "1,900" (en) or "1 900" (lt). */
export function formatNumber(value: number, locale: Locale = defaultLocale, maximumFractionDigits = 0): string {
  const cacheKey = `${locale}:${maximumFractionDigits}`;
  let formatter = formatters.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(intlLocales[locale], { maximumFractionDigits });
    formatters.set(cacheKey, formatter);
  }
  return formatter.format(value);
}

export type PluralForms = { readonly one: string; readonly other: string };

/**
 * Pick the plural form for `count` and fill `{count}` (formatted) plus any
 * other placeholders. Lithuanian needs "few"/"many" forms too; extend
 * PluralForms when that locale is added.
 */
export function formatPlural(
  forms: PluralForms,
  count: number,
  values: Record<string, string | number> = {},
  locale: Locale = defaultLocale,
): string {
  const template = new Intl.PluralRules(locale).select(count) === "one" ? forms.one : forms.other;
  return formatMessage(template, { count: formatNumber(count, locale), ...values });
}

export type DateStyle = "weekdayShort" | "dayOfMonth" | "dayShort" | "dayLong";

const dateOptions: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  weekdayShort: { weekday: "short" }, // "Thu"
  dayOfMonth: { day: "numeric" }, // "26"
  dayShort: { weekday: "short", day: "numeric", month: "short" }, // "Thu 26 Nov"
  dayLong: { weekday: "long", day: "numeric", month: "long" }, // "Thursday 26 November"
};

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function dateFormatter(style: DateStyle | "range", locale: Locale): Intl.DateTimeFormat {
  const key = `${locale}:${style}`;
  let formatter = dateFormatters.get(key);
  if (!formatter) {
    const options = style === "range" ? { day: "numeric", month: "short", year: "numeric" } as const : dateOptions[style];
    // Calendar dates are midnight UTC internally; format them in UTC so they never shift.
    formatter = new Intl.DateTimeFormat(intlLocales[locale], { ...options, timeZone: "UTC" });
    dateFormatters.set(key, formatter);
  }
  return formatter;
}

/** Format a `YYYY-MM-DD` calendar date. */
export function formatDate(iso: string, style: DateStyle, locale: Locale = defaultLocale): string {
  return dateFormatter(style, locale).format(isoDateToUtc(iso));
}

/** Format a range of calendar dates, e.g. "23–29 Nov 2026". */
export function formatDateRange(startIso: string, endIso: string, locale: Locale = defaultLocale): string {
  return dateFormatter("range", locale).formatRange(isoDateToUtc(startIso), isoDateToUtc(endIso));
}
