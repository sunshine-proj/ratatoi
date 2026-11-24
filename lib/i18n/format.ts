import { defaultLocale, type Locale } from "./index";

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
