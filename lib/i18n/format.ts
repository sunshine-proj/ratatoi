import { defaultLocale, formatMessage, type Locale } from "./index";

const formatters = new Map<string, Intl.NumberFormat>();

/** Locale-aware number formatting, e.g. 1900 → "1,900" (en) or "1 900" (lt). */
export function formatNumber(value: number, locale: Locale = defaultLocale, maximumFractionDigits = 0): string {
  const cacheKey = `${locale}:${maximumFractionDigits}`;
  let formatter = formatters.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { maximumFractionDigits });
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
