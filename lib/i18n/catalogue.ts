import type { Locale, Messages } from "./index";
import { en } from "./messages/en";
import { et } from "./messages/et";
import { lt } from "./messages/lt";
import { lv } from "./messages/lv";

/**
 * Every locale's messages. Import this on the server only: Client
 * Components get their locale's messages from `useI18n()`, so the browser
 * never downloads all four catalogues.
 */
const catalogue: Record<Locale, Messages> = { en, lv, lt, et };

export function getMessages(locale: Locale): Messages {
  return catalogue[locale];
}
