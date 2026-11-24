"use client";

import { useToast } from "@/components/ui/toast";
import { getMessages } from "@/lib/i18n";
import type { MealPlan } from "@/lib/planner/schema";
import { opContext, usePlan } from "@/lib/planner/use-plan";

/**
 * Applies planner operations to the saved plan and reports failures.
 * Refuses to write when the saved plan is unreadable, so a damaged plan is
 * never silently replaced (the user resets it explicitly instead).
 */
export function usePlanActions() {
  const { state, update, reset } = usePlan();
  const toast = useToast();
  const t = getMessages();

  function apply(change: (plan: MealPlan, ctx: ReturnType<typeof opContext>) => MealPlan): boolean {
    if (state.status === "invalid") {
      toast.show({ message: t.planner.loadFailedTitle, tone: "error" });
      return false;
    }
    const ctx = opContext();
    const result = update((plan) => change(plan, ctx));
    if (!result.ok) {
      toast.show({ message: t.settings.saveFailed, tone: "error", duration: null });
      return false;
    }
    return true;
  }

  return { state, apply, reset, plan: state.status === "ready" ? state.value : null };
}
