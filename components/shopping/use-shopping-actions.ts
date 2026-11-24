"use client";

import { useToast } from "@/components/ui/toast";
import { getMessages } from "@/lib/i18n";
import type { ShoppingList } from "@/lib/shopping/schema";
import { useShoppingList } from "@/lib/shopping/use-shopping-list";

/** Applies list operations, reporting failures and never overwriting an unreadable list. */
export function useShoppingActions() {
  const { state, update, reset } = useShoppingList();
  const toast = useToast();
  const t = getMessages();

  function apply(change: (list: ShoppingList) => ShoppingList): boolean {
    if (state.status === "invalid") {
      toast.show({ message: t.shopping.loadFailedTitle, tone: "error" });
      return false;
    }
    const result = update(change);
    if (!result.ok) {
      toast.show({ message: t.settings.saveFailed, tone: "error", duration: null });
      return false;
    }
    return true;
  }

  return { state, apply, reset };
}
