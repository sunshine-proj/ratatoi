"use client";

import { Fragment, useId, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { getIngredient } from "@/lib/ingredients/catalogue";
import { formatMessage, getMessages } from "@/lib/i18n";
import { formatShoppingAmount, shoppingItemName } from "@/lib/shopping/format";
import type { ShoppingItem } from "@/lib/shopping/schema";

/**
 * Compact list row. The checkbox label is the full line ("450 g Chicken
 * breast"), so screen readers announce what is being ticked.
 */
export function ShoppingItemRow({ item, recipeName, onToggle, onEdit, onRemove }: {
  item: ShoppingItem;
  recipeName: (slug: string) => string | undefined;
  onToggle: (checked: boolean) => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const t = getMessages();
  const s = t.shopping;
  const id = useId();
  const ingredient = item.canonicalKey ? getIngredient(item.canonicalKey) : undefined;
  const amount = formatShoppingAmount(item, t, ingredient);
  const name = shoppingItemName(item, ingredient);
  const label = amount ? `${amount} ${name}` : name;
  const recipes = [...new Set(item.sources.map((source) => recipeName(source.recipeSlug)).filter(Boolean))] as string[];
  const planAmount =
    item.edited && item.planQuantity !== null
      ? formatShoppingAmount({ quantity: item.planQuantity, unit: item.planUnit }, t, ingredient)
      : null;
  const details: { key: string; node: ReactNode }[] = [];
  if (recipes.length > 0) details.push({ key: "recipes", node: formatMessage(s.forRecipes, { list: recipes.join(", ") }) });
  if (item.origin === "manual") details.push({ key: "manual", node: <Tag className="text-xs">{s.yourItem}</Tag> });
  if (planAmount) details.push({ key: "edited", node: formatMessage(s.editedNote, { amount: planAmount }) });

  return (
    <li className="flex items-start gap-2 py-1.5">
      <div className="flex min-h-11 min-w-0 flex-1 items-start gap-3 py-1.5">
        <input
          id={id}
          type="checkbox"
          checked={item.checked}
          onChange={(event) => onToggle(event.target.checked)}
          // Named by the line itself; recipes and notes are the description.
          aria-labelledby={`${id}-label`}
          aria-describedby={details.length > 0 ? `${id}-details` : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
        />
        <span className="flex min-w-0 flex-col gap-0.5">
          <label id={`${id}-label`} htmlFor={id} className={cn("cursor-pointer", item.checked && "text-ink-muted line-through")}>
            {amount ? <span className="font-semibold">{amount}</span> : null}
            {amount ? " " : null}
            {name}
          </label>
          {details.length > 0 ? (
            <span id={`${id}-details`} className="flex flex-col gap-0.5 text-xs text-ink-muted">
              {details.map((detail, index) => (
                <Fragment key={detail.key}>
                  {/* A real space between parts, so the description reads as sentences. */}
                  {index > 0 ? " " : null}
                  <span>{detail.node}</span>
                </Fragment>
              ))}
            </span>
          ) : null}
        </span>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={formatMessage(s.editFor, { name: label })}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-ink"
      >
        <Icon name="pencil" className="size-5" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={formatMessage(s.removeFor, { name: label })}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-ink"
      >
        <Icon name="trash" className="size-5" />
      </button>
    </li>
  );
}
