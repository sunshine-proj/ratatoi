import type { en } from "./messages/en";

/**
 * Locales, paths, and message helpers. Safe to import anywhere (server or
 * browser): it holds no message catalogues. Load messages with
 * `getMessages` (`@/lib/i18n/catalogue`) on the server, `getI18n()`
 * (`@/lib/i18n/server`) in Server Components, or `useI18n()`
 * (`@/lib/i18n/client`) in Client Components.
 *
 * Routing: English is served without a prefix (`/recipes`); the other
 * locales are prefixed (`/lt/recipes`). `proxy.ts` rewrites unprefixed
 * paths to `/en/...` internally.
 */
export const locales = ["en", "lv", "lt", "et"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Each language's name in that language, for the language picker. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  lv: "Latviešu",
  lt: "Lietuvių",
  et: "Eesti",
};

/**
 * Intl locale per app locale. English uses en-GB conventions (day before
 * month, 24-hour time), matching the app's EU defaults.
 */
export const intlLocales: Record<Locale, string> = {
  en: "en-GB",
  lv: "lv-LV",
  lt: "lt-LT",
  et: "et-EE",
};

/** Cookie that remembers a language the person chose in the app. */
export const LOCALE_COOKIE = "pp-locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return (locales as readonly string[]).includes(value ?? "");
}

/** `/recipes` → `/lt/recipes` (or unchanged for English). Keeps query and hash. */
export function localePath(locale: Locale, path: string): string {
  if (!path.startsWith("/") || locale === defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * `/lt/recipes` → `{ locale: "lt", path: "/recipes" }`; unprefixed paths are
 * English. `/en/...` is also understood: it's the internal path English pages
 * are rewritten to, and what `usePathname()` reports on them.
 */
export function splitLocale(pathname: string): { locale: Locale; path: string; prefixed: boolean } {
  const first = pathname.split("/")[1] ?? "";
  if (isLocale(first)) {
    return { locale: first, path: pathname.slice(first.length + 1) || "/", prefixed: true };
  }
  return { locale: defaultLocale, path: pathname, prefixed: false };
}

/**
 * Pick a supported locale from an Accept-Language header, honouring
 * q-values: "lt-LT,lt;q=0.9,en;q=0.8" → "lt". Returns null if none match.
 */
export function matchAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const quality = q ? Number(q.slice(2)) : 1;
      return { language: tag.trim().toLowerCase().split("-")[0] ?? "", quality: Number.isFinite(quality) ? quality : 0, index };
    })
    .filter((entry) => entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
  for (const { language } of ranked) if (isLocale(language)) return language;
  return null;
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

/**
 * Plural forms, named by CLDR plural category. `one` and `other` are always
 * required; languages add the categories they use: Latvian `zero`,
 * Lithuanian `few` and `many`. A missing category falls back to `other`.
 */
export type PluralForms = {
  readonly zero?: string;
  readonly one: string;
  readonly two?: string;
  readonly few?: string;
  readonly many?: string;
  readonly other: string;
};

type DeepMessages<T> = {
  readonly [K in keyof T]: K extends "meta"
    ? { readonly locale: Locale }
    : T[K] extends string
      ? string
      : T[K] extends { readonly one: string; readonly other: string }
        ? PluralForms
        : DeepMessages<T[K]>;
};

/** The message shape every locale provides, defined by the English catalogue. */
export type Messages = DeepMessages<typeof en>;
