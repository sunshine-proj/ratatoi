import { LOCALE_COOKIE, type Locale } from "./index";

/*
 * The one cookie the app sets, and only when someone picks a language. It
 * holds just the language code ("lt") so that opening the bare address
 * goes straight to that language. It's a functional cookie set at the
 * person's request: no identifier, no tracking. Settings → Account →
 * "Delete everything" removes it.
 */
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function rememberLocale(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

export function forgetLocale(): void {
  document.cookie = `${LOCALE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
