import { isoDateToUtc } from "@/lib/dates";
import { formatMessage, intlLocales, type Locale, type PluralForms } from "./index";

const formatters = new Map<string, Intl.NumberFormat>();

/** Locale-aware number formatting, e.g. 1900 → "1,900" (en) or "1 900" (lt); 2.5 → "2,5" (lt). */
export function formatNumber(value: number, locale: Locale, maximumFractionDigits = 0): string {
  const cacheKey = `${locale}:${maximumFractionDigits}`;
  let formatter = formatters.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(intlLocales[locale], { maximumFractionDigits });
    formatters.set(cacheKey, formatter);
  }
  return formatter.format(value);
}

const pluralRules = new Map<Locale, Intl.PluralRules>();

/** The plural form for `count` in this locale (CLDR rules), falling back to `other`. */
export function selectPlural(forms: PluralForms, count: number, locale: Locale): string {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(intlLocales[locale]);
    pluralRules.set(locale, rules);
  }
  const category = rules.select(count) as keyof PluralForms;
  return forms[category] ?? forms.other;
}

/**
 * Pick the plural form for `count` and fill `{count}` (formatted) plus any
 * other placeholders.
 */
export function formatPlural(
  forms: PluralForms,
  count: number,
  locale: Locale,
  values: Record<string, string | number> = {},
): string {
  return formatMessage(selectPlural(forms, count, locale), { count: formatNumber(count, locale, 2), ...values });
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

/** Sentence-start capitalisation: Baltic weekday and month names are lowercase in Intl. */
export function capitalize(text: string, locale: Locale): string {
  return text.charAt(0).toLocaleUpperCase(intlLocales[locale]) + text.slice(1);
}

/** Format a `YYYY-MM-DD` calendar date. */
export function formatDate(iso: string, style: DateStyle, locale: Locale): string {
  return capitalize(dateFormatter(style, locale).format(isoDateToUtc(iso)), locale);
}

/** Format a range of calendar dates, e.g. "23–29 Nov 2026". */
export function formatDateRange(startIso: string, endIso: string, locale: Locale): string {
  return dateFormatter("range", locale).formatRange(isoDateToUtc(startIso), isoDateToUtc(endIso));
}

const timestampFormatters = new Map<string, Intl.DateTimeFormat>();

/** A moment in the user's local time, 24-hour clock: "24 Nov, 14:05". */
export function formatTimestamp(isoDateTime: string, locale: Locale): string {
  let formatter = timestampFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(intlLocales[locale], {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    timestampFormatters.set(locale, formatter);
  }
  return formatter.format(new Date(isoDateTime));
}

/** Lowercase a label for use mid-sentence ("Breakfast" → "breakfast"). */
export function lowercase(text: string, locale: Locale): string {
  return text.toLocaleLowerCase(intlLocales[locale]);
}
