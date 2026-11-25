/**
 * Parsing for numeric text inputs.
 *
 * Inputs are plain text (with `inputMode`) rather than `type="number"` so that
 * EU-style decimal commas ("72,5") and grouped thousands ("1,900", "1 900")
 * work consistently across browsers and locales.
 *
 * Separators follow the locale. English: "1,900" is a grouped thousand and
 * any other comma is a decimal ("72,5"). Latvian, Lithuanian, Estonian: a
 * comma is always the decimal separator ("1,25" is 1.25), and spaces group
 * thousands ("1 900"). A dot is read as a decimal point everywhere.
 *
 * Errors are returned as codes; the UI turns them into translated messages.
 */
import type { Locale } from "@/lib/i18n";

export type FieldError =
  | { code: "required" }
  | { code: "notANumber" }
  | { code: "notWholeNumber" }
  | { code: "outOfRange"; min: number; max: number }
  | { code: "adultsOnly" }
  | { code: "tooLong"; max: number };

export type NumberFieldOptions = {
  min: number;
  max: number;
  integer?: boolean;
  required?: boolean;
  /** Defaults to English rules. */
  locale?: Locale;
};

export type NumberFieldResult = { ok: true; value: number | null } | { ok: false; error: FieldError };

const GROUPED_THOUSANDS = /^\d{1,3}(,\d{3})+$/;
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

export function parseNumberField(raw: string, options: NumberFieldOptions): NumberFieldResult {
  let text = raw.trim().replace(/[\s  ]/g, "");

  if (text === "") {
    return options.required ? { ok: false, error: { code: "required" } } : { ok: true, value: null };
  }

  // English: "1,900" is a grouped thousand; any other comma is a decimal separator.
  const englishGrouping = (options.locale ?? "en") === "en" && GROUPED_THOUSANDS.test(text);
  text = englishGrouping ? text.replace(/,/g, "") : text.replace(",", ".");

  if (!PLAIN_NUMBER.test(text)) return { ok: false, error: { code: "notANumber" } };

  const value = Number(text);
  if (options.integer && !Number.isInteger(value)) return { ok: false, error: { code: "notWholeNumber" } };
  if (value < options.min || value > options.max) {
    return { ok: false, error: { code: "outOfRange", min: options.min, max: options.max } };
  }
  return { ok: true, value };
}

/** Show a stored number back in an input; null becomes an empty field. Uses a decimal comma outside English. */
export function numberToInput(value: number | null | undefined, locale: Locale = "en"): string {
  if (value === null || value === undefined) return "";
  return locale === "en" ? String(value) : String(value).replace(".", ",");
}
