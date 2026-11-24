import { en, type Messages } from "./messages/en";

/**
 * Translation-ready strings without a routing or runtime dependency.
 *
 * To add Lithuanian: create `messages/lt.ts` exporting `lt: Messages`,
 * add "lt" to `locales`, and register it in `catalogue`. The `Messages`
 * type makes a missing key a compile error.
 */
export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

const catalogue: Record<Locale, Messages> = { en };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getMessages(locale: Locale = defaultLocale): Messages {
  return catalogue[locale];
}

/**
 * Fill `{name}` placeholders. Unknown placeholders are left as-is so a
 * missing value is visible rather than silently blank.
 */
export function formatMessage(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}

export type { Messages };
