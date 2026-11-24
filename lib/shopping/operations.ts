import { resolveIngredientKey, getIngredient } from "@/lib/ingredients/catalogue";
import { compareItems, type GeneratedItem } from "./aggregate";
import type { ShoppingCategory, ShoppingItem, ShoppingList, ShoppingUnit } from "./schema";

/**
 * Pure shopping-list operations. Each returns a new list and never mutates
 * its input. Items stay sorted by aisle, then name.
 */

const sorted = (items: ShoppingItem[]) => [...items].sort(compareItems);

/**
 * Replace the generated lines with a fresh calculation, keeping:
 * - every manual item, untouched;
 * - the tick on any generated line whose id still exists;
 * - the user's amount/unit/aisle on generated lines they edited (the plan's
 *   new amount is still recorded in planQuantity, so the UI can show both).
 * Generated lines the plan no longer needs are dropped, even if ticked.
 */
export function regenerate(
  previous: ShoppingList,
  generated: readonly GeneratedItem[],
  range: { start: string; end: string },
  now: Date,
): ShoppingList {
  const previousById = new Map(previous.items.map((item) => [item.id, item]));
  const fresh = generated.map((item): ShoppingItem => {
    const before = previousById.get(item.id);
    if (!before || before.origin !== "generated") return { ...item, checked: false, edited: false };
    return {
      ...item,
      checked: before.checked,
      edited: before.edited,
      quantity: before.edited ? before.quantity : item.quantity,
      unit: before.edited ? before.unit : item.unit,
      category: before.edited ? before.category : item.category,
    };
  });
  const manual = previous.items.filter((item) => item.origin === "manual");
  return { version: 1, range, generatedAt: now.toISOString(), items: sorted([...fresh, ...manual]) };
}

/**
 * Whether the saved generated lines still match what the plan needs now
 * (same lines, same plan amounts). Ticks and manual items don't matter.
 */
export function isUpToDate(list: ShoppingList, generated: readonly GeneratedItem[]): boolean {
  const signature = (items: readonly { id: string; planQuantity: number | null; planUnit: string | null }[]) =>
    items
      .map((item) => `${item.id}=${item.planQuantity === null ? "" : item.planQuantity.toFixed(4)}${item.planUnit ?? ""}`)
      .sort()
      .join("|");
  return signature(list.items.filter((item) => item.origin === "generated")) === signature(generated);
}

export function setChecked(list: ShoppingList, id: string, checked: boolean): ShoppingList {
  return { ...list, items: list.items.map((item) => (item.id === id ? { ...item, checked } : item)) };
}

export function uncheckAll(list: ShoppingList): ShoppingList {
  return { ...list, items: list.items.map((item) => (item.checked ? { ...item, checked: false } : item)) };
}

export function removeItem(list: ShoppingList, id: string): ShoppingList {
  return { ...list, items: list.items.filter((item) => item.id !== id) };
}

export function restoreItem(list: ShoppingList, item: ShoppingItem): ShoppingList {
  if (list.items.some((other) => other.id === item.id)) return list;
  return { ...list, items: sorted([...list.items, item]) };
}

export function editItem(
  list: ShoppingList,
  id: string,
  changes: { quantity: number | null; unit: ShoppingUnit | null; category: ShoppingCategory; name?: string },
): ShoppingList {
  return {
    ...list,
    items: sorted(
      list.items.map((item) => {
        if (item.id !== id) return item;
        const name = item.origin === "manual" && changes.name ? changes.name.trim() : item.name;
        const edited =
          item.origin === "generated" &&
          (item.edited || changes.quantity !== item.quantity || changes.unit !== item.unit || changes.category !== item.category);
        return { ...item, ...changes, name, edited };
      }),
    ),
  };
}

/** Aisle for a manual item: from the ingredient catalogue when the name matches, else "other". */
export function categoryFor(name: string): { canonicalKey: string | null; category: ShoppingCategory } {
  const key = resolveIngredientKey(name) ?? null;
  const ingredient = key ? getIngredient(key) : undefined;
  return { canonicalKey: key, category: ingredient?.category ?? "other" };
}

export function addManualItem(
  list: ShoppingList,
  input: { name: string; quantity: number | null; unit: ShoppingUnit | null; category?: ShoppingCategory },
  newId: () => string,
): ShoppingList {
  const name = input.name.trim().replace(/\s+/g, " ");
  const detected = categoryFor(name);
  const item: ShoppingItem = {
    id: `manual:${newId()}`,
    origin: "manual",
    name,
    canonicalKey: detected.canonicalKey,
    category: input.category ?? detected.category,
    quantity: input.quantity,
    unit: input.quantity === null ? null : input.unit,
    checked: false,
    edited: false,
    planQuantity: null,
    planUnit: null,
    sources: [],
  };
  return { ...list, items: sorted([...list.items, item]) };
}

export function clearList(): ShoppingList {
  return { version: 1, range: null, generatedAt: null, items: [] };
}
