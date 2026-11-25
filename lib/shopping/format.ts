import type { LocalizedIngredientName } from "@/lib/ingredients/catalogue";
import type { Messages } from "@/lib/i18n";
import { formatNumber, formatPlural } from "@/lib/i18n/format";
import { formatQuantity, pieceWord } from "@/lib/recipes/format";
import type { ShoppingItem } from "./schema";

/** Round to the nearest quarter, but never show a needed amount as zero. */
function quarters(value: number): number {
  const rounded = Math.round(value * 4) / 4;
  return value > 0 && rounded === 0 ? 0.25 : rounded;
}

/**
 * Display amount for a list line, e.g. "450 g", "1.2 kg", "2 tsp", "3 cloves".
 * Full precision stays in the data; this only rounds for display.
 */
export function formatShoppingAmount(
  item: Pick<ShoppingItem, "quantity" | "unit">,
  t: Messages,
  ingredient?: Pick<LocalizedIngredientName, "pieceName">,
): string {
  const { quantity, unit } = item;
  const locale = t.meta.locale;
  if (quantity === null) return "";
  const u = t.shopping.units;
  switch (unit) {
    case "g":
      return quantity >= 1000 ? `${formatNumber(quantity / 1000, locale, 2)} ${u.kg}` : `${formatNumber(Math.max(1, Math.round(quantity)), locale)} ${u.g}`;
    case "ml":
      return quantity >= 1000 ? `${formatNumber(quantity / 1000, locale, 2)} ${u.l}` : `${formatNumber(Math.max(1, Math.round(quantity)), locale)} ${u.ml}`;
    case "tsp":
    case "tbsp":
      return `${formatQuantity(quarters(quantity), locale)} ${u[unit]}`;
    case "piece": {
      const amount = quarters(quantity);
      if (!ingredient?.pieceName) return formatQuantity(amount, locale);
      return `${formatQuantity(amount, locale)} ${pieceWord(ingredient.pieceName, amount, locale)}`;
    }
    case "kg":
    case "l":
      return `${formatNumber(quantity, locale, 2)} ${u[unit]}`;
    case "pack":
      return formatPlural(t.shopping.packs, quantity, locale, { count: formatNumber(quantity, locale, 2) });
    case null:
      return formatNumber(quantity, locale, 2);
  }
}

/**
 * Name for a line. Lines generated from the plan use the ingredient's name in the
 * current language (singular for one piece or less in English: "1 Lemon").
 * Items you added keep the name you typed.
 */
export function shoppingItemName(
  item: Pick<ShoppingItem, "name" | "quantity" | "unit" | "origin">,
  ingredient?: Pick<LocalizedIngredientName, "name" | "singularName">,
): string {
  if (!ingredient || item.origin !== "generated") return item.name;
  if (item.unit === "piece" && item.quantity !== null && quarters(item.quantity) <= 1 && ingredient.singularName) {
    return ingredient.singularName;
  }
  return ingredient.name;
}
