"use client";

import { createContext, use, type ReactNode } from "react";
import type { Locale, Messages } from "./index";
import { en } from "./messages/en";

type I18n = { locale: Locale; t: Messages };

/*
 * Defaults to English so components render in isolation (unit tests).
 * The root layout always provides the page's locale.
 */
const I18nContext = createContext<I18n>({ locale: "en", t: en });

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: ReactNode }) {
  return <I18nContext value={{ locale, t: messages }}>{children}</I18nContext>;
}

/** The current locale and its messages, for Client Components. */
export function useI18n(): I18n {
  return use(I18nContext);
}
