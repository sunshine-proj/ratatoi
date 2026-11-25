"use client";

import { Link } from "@/components/ui/link";
import { useState, type FormEvent } from "react";
import { focusFirstError } from "@/components/forms/field-error";
import { DocumentGate } from "@/components/storage/document-gate";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { toLocalIsoDate } from "@/lib/dates";
import { getIngredient, getLocalizedIngredientName } from "@/lib/ingredients/catalogue";
import { formatMessage, intlLocales } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { formatDateRange, formatPlural, formatTimestamp } from "@/lib/i18n/format";
import { routes } from "@/lib/navigation";
import { emptyPlan, type MealPlan } from "@/lib/planner/schema";
import { usePlan } from "@/lib/planner/use-plan";
import { generateItems, type RecipeIngredientIndex } from "@/lib/shopping/aggregate";
import { formatShoppingAmount, shoppingItemName } from "@/lib/shopping/format";
import { emptyItemDraft, parseItemDraft, type ItemDraft, type ItemErrors, type ParsedItem } from "@/lib/shopping/item-form";
import { numberToInput } from "@/lib/forms/number-field";
import {
  addManualItem,
  clearList,
  editItem,
  isUpToDate,
  regenerate,
  removeItem,
  restoreItem,
  setChecked,
  uncheckAll,
} from "@/lib/shopping/operations";
import { matchPreset, presetRange, validateRange, type DateRange, type RangePreset } from "@/lib/shopping/range";
import { emptyShoppingList, shoppingCategories, type ShoppingItem, type ShoppingList } from "@/lib/shopping/schema";
import { ItemFields } from "./item-fields";
import { RangePicker } from "./range-picker";
import { ShoppingItemRow } from "./shopping-item-row";
import { useShoppingActions } from "./use-shopping-actions";

export function ShoppingListView({ recipeIndex, recipeNames }: {
  recipeIndex: RecipeIngredientIndex;
  recipeNames: Record<string, string>;
}) {
  const { t } = useI18n();
  const plan = usePlan();
  const shopping = useShoppingActions();
  const planCopy = { title: t.planner.loadFailedTitle, body: t.planner.loadFailedBody, reset: t.planner.reset, resetDone: t.planner.resetDone };
  const listCopy = { title: t.shopping.loadFailedTitle, body: t.shopping.loadFailedBody, reset: t.shopping.reset, resetDone: t.shopping.resetDone };

  return (
    <DocumentGate state={plan.state} reset={plan.reset} copy={planCopy}>
      {(savedPlan) => (
        <DocumentGate state={shopping.state} reset={shopping.reset} copy={listCopy}>
          {(savedList) => (
            <ShoppingListContent
              plan={savedPlan ?? emptyPlan}
              list={savedList ?? emptyShoppingList}
              recipeIndex={recipeIndex}
              recipeNames={recipeNames}
            />
          )}
        </DocumentGate>
      )}
    </DocumentGate>
  );
}

function ShoppingListContent({ plan, list, recipeIndex, recipeNames }: {
  plan: MealPlan;
  list: ShoppingList;
  recipeIndex: RecipeIngredientIndex;
  recipeNames: Record<string, string>;
}) {
  const { t, locale } = useI18n();
  const s = t.shopping;
  const toast = useToast();
  const { apply } = useShoppingActions();
  const today = toLocalIsoDate();

  // Reopen on the saved list's dates when there is one.
  const [preset, setPreset] = useState<RangePreset>(() => (list.range ? matchPreset(list.range, today) : "thisWeek"));
  const [custom, setCustom] = useState<DateRange>(() => list.range ?? presetRange("thisWeek", today));
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const range = preset === "custom" ? custom : presetRange(preset, today);
  const rangeError = validateRange(range);
  const preview = rangeError ? null : generateItems(plan.meals, range, recipeIndex, getIngredient);
  const hasGenerated = list.items.some((item) => item.origin === "generated");
  const savedRangeFresh = list.range ? generateItems(plan.meals, list.range, recipeIndex, getIngredient) : null;
  const stale = Boolean(list.range && savedRangeFresh && !isUpToDate(list, savedRangeFresh.items));
  const checkedCount = list.items.filter((item) => item.checked).length;
  const recipeName = (slug: string) => recipeNames[slug];

  function generate(target: DateRange) {
    const result = generateItems(plan.meals, target, recipeIndex, getIngredient);
    if (apply((current) => regenerate(current, result.items, target, new Date()))) {
      toast.show({ message: s.generated, tone: "success" });
    }
  }

  function remove(item: ShoppingItem) {
    const label = itemLabel(item);
    if (!apply((current) => removeItem(current, item.id))) return;
    toast.show({
      message: formatMessage(s.removed, { name: label }),
      action: { label: t.planner.undo, onClick: () => apply((current) => restoreItem(current, item)) },
    });
  }

  function itemName(item: ShoppingItem): string {
    return shoppingItemName(item, item.canonicalKey ? getLocalizedIngredientName(item.canonicalKey, locale) : undefined);
  }

  function itemLabel(item: ShoppingItem): string {
    const ingredient = item.canonicalKey ? getLocalizedIngredientName(item.canonicalKey, locale) : undefined;
    const amount = formatShoppingAmount(item, t, ingredient);
    const name = itemName(item);
    return amount ? `${amount} ${name}` : name;
  }

  const collator = new Intl.Collator(intlLocales[locale]);

  // Only format a valid range: a half-typed custom date must not crash the page.
  const rangeLabel = rangeError ? "" : formatDateRange(range.start, range.end, locale);
  const nothingPlanned = preview !== null && preview.recipeMeals === 0;

  const rangeCard = (
      <Card as="section" aria-labelledby="shopping-range-title" className="flex flex-col gap-4">
        <h2 id="shopping-range-title" className="sr-only">
          {s.range.legend}
        </h2>
        <RangePicker
          preset={preset}
          custom={custom}
          today={today}
          error={rangeError}
          onPresetChange={setPreset}
          onCustomChange={setCustom}
        />
        {preview ? (
          <>
            <p className="text-sm text-ink-muted">{formatMessage(s.explain, { range: rangeLabel })}</p>
            {preview.customMeals > 0 ? (
              <p className="flex items-start gap-2 text-sm">
                <Icon name="info" className="mt-0.5 size-4 shrink-0" />
                {formatPlural(s.customMealsSkipped, preview.customMeals, locale)}
              </p>
            ) : null}
            {preview.missingRecipes > 0 ? (
              <p className="flex items-start gap-2 text-sm">
                <Icon name="info" className="mt-0.5 size-4 shrink-0" />
                {formatPlural(s.missingRecipes, preview.missingRecipes, locale)}
              </p>
            ) : null}
            {nothingPlanned ? (
              <div className="flex flex-col items-start gap-2 rounded-control bg-surface-muted px-4 py-3">
                <h3 className="font-sans font-semibold">{s.nothingPlanned.title}</h3>
                <p className="text-sm">{s.nothingPlanned.body}</p>
                <Link href={`${routes.planner}?date=${range.start}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                  {s.nothingPlanned.cta}
                </Link>
              </div>
            ) : (
              <Button className="self-start" onClick={() => generate(range)}>
                {hasGenerated ? s.update : s.generate}
              </Button>
            )}
          </>
        ) : null}
      </Card>
  );
  // In the shop, the list matters most: once there is one, show it first.
  const listFirst = list.items.length > 0;

  return (
    <div className="flex flex-col gap-8">
      {listFirst ? null : rangeCard}
      <section aria-labelledby="shopping-list-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="shopping-list-title" className="text-2xl font-semibold">
              {s.listTitle}
            </h2>
            {list.items.length > 0 ? (
              <p role="status" className="text-sm text-ink-muted">
                {formatMessage(s.progress, { checked: checkedCount, total: list.items.length })}
              </p>
            ) : null}
          </div>
          {list.items.length > 0 ? (
            <div className="flex gap-2">
              {checkedCount > 0 ? (
                <Button variant="ghost" size="sm" onClick={() => apply(uncheckAll)}>
                  {s.uncheckAll}
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
                {s.clear}
              </Button>
            </div>
          ) : null}
        </div>

        {list.range && list.generatedAt ? (
          <p className="text-sm text-ink-muted">
            {formatMessage(s.lastUpdated, {
              range: formatDateRange(list.range.start, list.range.end, locale),
              time: formatTimestamp(list.generatedAt, locale),
            })}
          </p>
        ) : null}
        {stale && list.range ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line-strong bg-surface-muted px-4 py-3">
            <p className="flex items-start gap-2">
              <Icon name="info" className="mt-0.5 size-5 shrink-0" />
              {s.stale}
            </p>
            <Button size="sm" onClick={() => generate(list.range!)}>
              {s.update}
            </Button>
          </div>
        ) : null}

        {list.items.length === 0 ? (
          <Card className="flex flex-col gap-1">
            <h3 className="font-sans font-semibold">{s.empty.title}</h3>
            <p className="text-ink-muted">{s.empty.body}</p>
          </Card>
        ) : (
          shoppingCategories.map((category) => {
            // Stored order is by English name; show each aisle in this language's order.
            const items = list.items
              .filter((item) => item.category === category)
              .sort((a, b) => collator.compare(itemName(a), itemName(b)) || a.id.localeCompare(b.id));
            if (items.length === 0) return null;
            const headingId = `aisle-${category}`;
            return (
              <section key={category} aria-labelledby={headingId} className="rounded-card border border-line bg-surface px-4 py-2">
                <div className="flex items-baseline justify-between gap-2 border-b border-line py-2">
                  <h3 id={headingId} className="font-sans text-base font-semibold">
                    {s.categories[category]}
                  </h3>
                  <span className="text-sm text-ink-muted">{formatPlural(s.aisleCount, items.length, locale)}</span>
                </div>
                <ul className="divide-y divide-line">
                  {items.map((item) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      recipeName={recipeName}
                      onToggle={(checked) => apply((current) => setChecked(current, item.id, checked))}
                      onEdit={() => setEditing(item)}
                      onRemove={() => remove(item)}
                    />
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </section>

      {listFirst ? rangeCard : null}

      <AddItemForm
        onAdd={(parsed) => {
          const ok = apply((current) =>
            addManualItem(current, parsed, () => crypto.randomUUID()),
          );
          if (ok) toast.show({ message: formatMessage(s.added, { name: parsed.name }), tone: "success" });
          return ok;
        }}
      />

      <EditItemDialog
        item={editing}
        onClose={() => setEditing(null)}
        onSave={(item, parsed) => {
          const ok = apply((current) =>
            editItem(current, item.id, {
              quantity: parsed.quantity,
              unit: parsed.unit,
              category: parsed.category ?? item.category,
              name: item.origin === "manual" ? parsed.name : undefined,
            }),
          );
          if (ok) {
            toast.show({ message: formatMessage(s.saved, { name: item.origin === "manual" ? parsed.name : item.name }), tone: "success" });
            setEditing(null);
          }
        }}
      />

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title={s.clearTitle}
        description={s.clearBody}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmClear(false)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const ok = apply(clearList);
                setConfirmClear(false);
                if (ok) toast.show({ message: s.cleared, tone: "success" });
              }}
            >
              {s.clear}
            </Button>
          </>
        }
      />
    </div>
  );
}

function AddItemForm({ onAdd }: { onAdd: (parsed: ParsedItem) => boolean }) {
  const { t, locale } = useI18n();
  const s = t.shopping;
  const [draft, setDraft] = useState<ItemDraft>(emptyItemDraft);
  const [errors, setErrors] = useState<ItemErrors>({});

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseItemDraft(draft, { requireName: true }, locale);
    if (!result.ok) {
      setErrors(result.errors);
      focusFirstError(
        (["name", "quantity"] as const).map((field) => ({ field, id: `add-item-${field}` })),
        result.errors,
      );
      return;
    }
    if (onAdd(result.value)) {
      setDraft(emptyItemDraft);
      setErrors({});
    }
  }

  return (
    <Card as="section" aria-labelledby="add-item-title" className="flex flex-col gap-4">
      <h2 id="add-item-title" className="text-xl font-semibold">
        {s.addTitle}
      </h2>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <ItemFields
          idPrefix="add-item"
          draft={draft}
          errors={errors}
          onChange={(next) => {
            setDraft(next);
            setErrors({});
          }}
          showName
          autoCategory
        />
        <Button type="submit" className="self-start">
          <Icon name="plus" className="size-4" />
          {s.add}
        </Button>
      </form>
    </Card>
  );
}

function EditItemDialog({ item, onClose, onSave }: {
  item: ShoppingItem | null;
  onClose: () => void;
  onSave: (item: ShoppingItem, parsed: ParsedItem) => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={item !== null} onClose={onClose} title={item ? formatMessage(t.shopping.editTitle, { name: item.name }) : ""}>
      {item ? <EditItemForm key={item.id} item={item} onCancel={onClose} onSave={onSave} /> : null}
    </Dialog>
  );
}

function EditItemForm({ item, onCancel, onSave }: {
  item: ShoppingItem;
  onCancel: () => void;
  onSave: (item: ShoppingItem, parsed: ParsedItem) => void;
}) {
  const { t, locale } = useI18n();
  const [draft, setDraft] = useState<ItemDraft>({
    name: item.name,
    quantity: numberToInput(item.quantity === null ? null : Math.round(item.quantity * 100) / 100, locale),
    unit: item.unit ?? "",
    category: item.category,
  });
  const [errors, setErrors] = useState<ItemErrors>({});
  const isManual = item.origin === "manual";

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const result = parseItemDraft(draft, { requireName: isManual }, locale);
        if (!result.ok) {
          setErrors(result.errors);
          focusFirstError(
            (["name", "quantity"] as const).map((field) => ({ field, id: `edit-item-${field}` })),
            result.errors,
          );
          return;
        }
        onSave(item, result.value);
      }}
    >
      <ItemFields
        idPrefix="edit-item"
        draft={draft}
        errors={errors}
        onChange={(next) => {
          setDraft(next);
          setErrors({});
        }}
        showName={isManual}
        autoCategory={false}
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="submit">{t.shopping.save}</Button>
      </div>
    </form>
  );
}
