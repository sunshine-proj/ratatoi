import { parseNumberField, type FieldError } from "@/lib/forms/number-field";
import { SHOPPING_NAME_MAX, shoppingCategories, shoppingUnits, type ShoppingCategory, type ShoppingUnit } from "./schema";

export type ItemDraft = { name: string; quantity: string; unit: string; category: string };
export type ItemErrors = Partial<Record<"name" | "quantity", FieldError>>;
export type ParsedItem = {
  name: string;
  quantity: number | null;
  unit: ShoppingUnit | null;
  /** Undefined means "choose for me" (from the ingredient catalogue). */
  category: ShoppingCategory | undefined;
};

export const emptyItemDraft: ItemDraft = { name: "", quantity: "", unit: "", category: "" };

const isUnit = (value: string): value is ShoppingUnit => (shoppingUnits as readonly string[]).includes(value);
const isCategory = (value: string): value is ShoppingCategory => (shoppingCategories as readonly string[]).includes(value);

/** Name is required (unless editing a generated line); amount is optional; a unit without an amount is dropped. */
export function parseItemDraft(
  draft: ItemDraft,
  options: { requireName: boolean },
): { ok: true; value: ParsedItem } | { ok: false; errors: ItemErrors } {
  const errors: ItemErrors = {};
  const name = draft.name.trim().replace(/\s+/g, " ");
  if (options.requireName) {
    if (name === "") errors.name = { code: "required" };
    else if (name.length > SHOPPING_NAME_MAX) errors.name = { code: "tooLong", max: SHOPPING_NAME_MAX };
  }
  const quantity = parseNumberField(draft.quantity, { min: 0, max: 100_000 });
  if (!quantity.ok) errors.quantity = quantity.error;
  if (!quantity.ok || errors.name) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      quantity: quantity.value,
      unit: quantity.value !== null && isUnit(draft.unit) ? draft.unit : null,
      category: isCategory(draft.category) ? draft.category : undefined,
    },
  };
}
