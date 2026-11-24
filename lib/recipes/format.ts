import { formatNumber } from "@/lib/i18n/format";
import type { Messages } from "@/lib/i18n";
import type { RecipeIngredientLine } from "./catalogue";

const FRACTIONS: Record<string, string> = { "0.25": "¼", "0.5": "½", "0.75": "¾" };

/** 0.5 → "½", 1.5 → "1½", 2 → "2", 2.3 → "2.3". */
export function formatQuantity(quantity: number): string {
  const whole = Math.floor(quantity);
  const fraction = Math.round((quantity - whole) * 100) / 100;
  const glyph = FRACTIONS[String(fraction)];
  if (glyph) return whole > 0 ? `${whole}${glyph}` : glyph;
  return formatNumber(quantity, undefined, 1);
}

/** The amount column of an ingredient line, e.g. "120 g", "1 tsp", "2 slices", "2". */
export function formatAmount(line: RecipeIngredientLine, t: Messages): string {
  const amount = formatQuantity(line.quantity);
  switch (line.unit) {
    case "g":
    case "ml":
    case "tsp":
    case "tbsp":
      return `${amount} ${t.units[line.unit]}`;
    case "piece":
      if (!line.pieceName) return amount;
      return `${amount} ${line.quantity <= 1 ? line.pieceName.one : line.pieceName.other}`;
  }
}
