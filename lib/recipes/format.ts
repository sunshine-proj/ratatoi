import { formatNumber, selectPlural } from "@/lib/i18n/format";
import type { Locale, Messages, PluralForms } from "@/lib/i18n";
import type { RecipeIngredientLine } from "./catalogue";

const FRACTIONS: Record<string, string> = { "0.25": "¼", "0.5": "½", "0.75": "¾" };

/** 0.5 → "½", 1.5 → "1½", 2 → "2", 2.3 → "2.3". */
export function formatQuantity(quantity: number, locale: Locale): string {
  const whole = Math.floor(quantity);
  const fraction = Math.round((quantity - whole) * 100) / 100;
  const glyph = FRACTIONS[String(fraction)];
  if (glyph) return whole > 0 ? `${whole}${glyph}` : glyph;
  return formatNumber(quantity, locale, 1);
}

/**
 * The counting word for an amount of pieces. English keeps its simple rule
 * ("½ slice", "1 slice", "2 slices"); other languages follow CLDR plural
 * rules (Lithuanian 1 skiltelė, 2 skiltelės, 10 skiltelių).
 */
export function pieceWord(forms: PluralForms, amount: number, locale: Locale): string {
  if (locale === "en") return amount <= 1 ? forms.one : forms.other;
  return selectPlural(forms, amount, locale);
}

/** The amount column of an ingredient line, e.g. "120 g", "1 tsp", "2 slices", "2". */
export function formatAmount(line: RecipeIngredientLine, t: Messages): string {
  const locale = t.meta.locale;
  const amount = formatQuantity(line.quantity, locale);
  switch (line.unit) {
    case "g":
    case "ml":
    case "tsp":
    case "tbsp":
      return `${amount} ${t.units[line.unit]}`;
    case "piece":
      if (!line.pieceName) return amount;
      return `${amount} ${pieceWord(line.pieceName, line.quantity, locale)}`;
  }
}
