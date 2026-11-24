import type { Ingredient } from "@/lib/ingredients/schema";
import type { Messages } from "@/lib/i18n";
import { formatNumber, formatPlural } from "@/lib/i18n/format";
import { formatQuantity } from "@/lib/recipes/format";
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
  ingredient?: Pick<Ingredient, "pieceName">,
): string {
  const { quantity, unit } = item;
  if (quantity === null) return "";
  const u = t.shopping.units;
  switch (unit) {
    case "g":
      return quantity >= 1000 ? `${formatNumber(quantity / 1000, undefined, 2)} ${u.kg}` : `${formatNumber(Math.max(1, Math.round(quantity)))} ${u.g}`;
    case "ml":
      return quantity >= 1000 ? `${formatNumber(quantity / 1000, undefined, 2)} ${u.l}` : `${formatNumber(Math.max(1, Math.round(quantity)))} ${u.ml}`;
    case "tsp":
    case "tbsp":
      return `${formatQuantity(quarters(quantity))} ${u[unit]}`;
    case "piece": {
      const amount = quarters(quantity);
      if (!ingredient?.pieceName) return formatQuantity(amount);
      return `${formatQuantity(amount)} ${amount <= 1 ? ingredient.pieceName.one : ingredient.pieceName.other}`;
    }
    case "kg":
    case "l":
      return `${formatNumber(quantity, undefined, 2)} ${u[unit]}`;
    case "pack":
      return formatPlural(t.shopping.packs, quantity, { count: formatNumber(quantity, undefined, 2) });
    case null:
      return formatNumber(quantity, undefined, 2);
  }
}

/** Name for a line: singular for one piece or less ("1 Lemon"). */
export function shoppingItemName(
  item: Pick<ShoppingItem, "name" | "quantity" | "unit">,
  ingredient?: Pick<Ingredient, "singularName">,
): string {
  if (item.unit === "piece" && item.quantity !== null && quarters(item.quantity) <= 1 && ingredient?.singularName) {
    return ingredient.singularName;
  }
  return item.name;
}
