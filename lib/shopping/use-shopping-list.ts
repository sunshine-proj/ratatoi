"use client";

import { useLocalDocument } from "@/lib/storage/use-local-document";
import { emptyShoppingList } from "./schema";
import { shoppingDocument } from "./store";

export function useShoppingList() {
  return useLocalDocument(shoppingDocument, emptyShoppingList);
}
