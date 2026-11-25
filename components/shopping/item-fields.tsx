"use client";

import { fieldErrorText } from "@/components/forms/field-error";
import { SelectField, TextField } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/client";
import type { ItemDraft, ItemErrors } from "@/lib/shopping/item-form";
import { shoppingCategories, shoppingUnits } from "@/lib/shopping/schema";

/** Name / amount / unit / aisle fields, shared by "Add your own item" and "Edit". */
export function ItemFields({ idPrefix, draft, errors, onChange, showName, autoCategory }: {
  idPrefix: string;
  draft: ItemDraft;
  errors: ItemErrors;
  onChange: (draft: ItemDraft) => void;
  showName: boolean;
  /** Offer "Choose for me" for the aisle (adding); editing uses explicit aisles. */
  autoCategory: boolean;
}) {
  const { t } = useI18n();
  const s = t.shopping;
  const set = (key: keyof ItemDraft, value: string) => onChange({ ...draft, [key]: value });

  return (
    <div className="flex flex-col gap-4">
      {showName ? (
        <TextField
          id={`${idPrefix}-name`}
          label={s.name}
          hint={s.nameHint}
          autoComplete="off"
          value={draft.name}
          onChange={(event) => set("name", event.target.value)}
          error={fieldErrorText(t, errors.name)}
        />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          id={`${idPrefix}-quantity`}
          label={s.quantity}
          hint={s.quantityHint}
          inputMode="decimal"
          autoComplete="off"
          value={draft.quantity}
          onChange={(event) => set("quantity", event.target.value)}
          error={fieldErrorText(t, errors.quantity)}
        />
        <SelectField id={`${idPrefix}-unit`} label={s.unit} value={draft.unit} onChange={(event) => set("unit", event.target.value)}>
          <option value="">{s.unitOptions.none}</option>
          {shoppingUnits.map((unit) => (
            <option key={unit} value={unit}>
              {s.unitOptions[unit]}
            </option>
          ))}
        </SelectField>
        <SelectField
          id={`${idPrefix}-category`}
          label={s.category}
          value={draft.category}
          onChange={(event) => set("category", event.target.value)}
        >
          {autoCategory ? <option value="">{s.autoCategory}</option> : null}
          {shoppingCategories.map((category) => (
            <option key={category} value={category}>
              {s.categories[category]}
            </option>
          ))}
        </SelectField>
      </div>
    </div>
  );
}
