"use client";

import { useLocalDocument } from "@/lib/storage/use-local-document";
import { emptyPlan } from "./schema";
import { planDocument } from "./store";

export function usePlan() {
  return useLocalDocument(planDocument, emptyPlan);
}

/** Context for planner operations in the browser. */
export function opContext() {
  return { now: new Date(), newId: () => crypto.randomUUID() };
}
