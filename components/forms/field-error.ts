import type { FieldError } from "@/lib/forms/number-field";
import { formatMessage, type Messages } from "@/lib/i18n";
import { formatNumber } from "@/lib/i18n/format";

/** Turn a field error code into a user-facing message. */
export function fieldErrorText(t: Messages, error: FieldError | undefined, kind: "value" | "choice" = "value"): string | undefined {
  if (!error) return undefined;
  switch (error.code) {
    case "required":
      return kind === "choice" ? t.forms.choose : t.forms.required;
    case "notANumber":
      return t.forms.notANumber;
    case "notWholeNumber":
      return t.forms.notWholeNumber;
    case "outOfRange":
      return formatMessage(t.forms.outOfRange, { min: formatNumber(error.min), max: formatNumber(error.max) });
    case "adultsOnly":
      return t.forms.adultsOnly;
    case "tooLong":
      return formatMessage(t.forms.tooLong, { max: error.max });
  }
}

/** Move focus to the first field (in the given order) that has an error. */
export function focusFirstError(order: readonly { field: string; id: string }[], errors: Record<string, unknown>) {
  const first = order.find(({ field }) => errors[field]);
  if (first) document.getElementById(first.id)?.focus();
}
