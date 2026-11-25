import { notFound } from "next/navigation";
import { locale as localeParam } from "next/root-params";
import { isLocale, type Locale, type Messages } from "./index";
import { getMessages } from "./catalogue";

/** The current request's locale and messages, for Server Components. */
export async function getI18n(): Promise<{ locale: Locale; t: Messages }> {
  const locale = await localeParam();
  if (!isLocale(locale)) notFound();
  return { locale, t: getMessages(locale) };
}
