import { render, renderHook, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { AccountSettings } from "@/components/settings/account-settings";
import { DocumentGate } from "@/components/storage/document-gate";
import { ToastProvider } from "@/components/ui/toast";
import { addMeal } from "@/lib/planner/operations";
import { emptyPlan } from "@/lib/planner/schema";
import { PLAN_STORAGE_KEY, planDocument } from "@/lib/planner/store";
import { usePlan } from "@/lib/planner/use-plan";
import { emptySettings, SETTINGS_STORAGE_KEY, settingsDocument } from "@/lib/settings/settings";
import { SHOPPING_STORAGE_KEY } from "@/lib/shopping/store";
import { deleteAllDeviceData } from "@/lib/storage/device-data";

beforeEach(() => localStorage.clear());

function seedPlan(meals: number) {
  let plan = emptyPlan;
  for (let i = 0; i < meals; i++) {
    plan = addMeal(plan, { kind: "recipe", recipeSlug: "chocolate-skyr-pot", date: "2026-11-26", mealType: "snack", servings: 1 }, { now: new Date(), newId: () => `m${i}` });
  }
  planDocument.write(plan);
}

describe("AccountSettings", () => {
  it("shows what is saved and deletes everything after confirming", async () => {
    settingsDocument.write(emptySettings);
    seedPlan(2);
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <AccountSettings />
      </ToastProvider>,
    );

    const stored = await screen.findByRole("region", { name: "Saved on this device" });
    expect(within(stored).getByText("2 planned meals")).toBeInTheDocument();
    expect(within(stored).getByText("Nothing saved")).toBeInTheDocument(); // shopping list
    expect(within(stored).getByText(/About .* KB in total/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete everything from this device" }));
    const dialog = screen.getByRole("dialog", { name: "Delete everything from this device?" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(localStorage.getItem(PLAN_STORAGE_KEY)).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Delete everything from this device" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete everything" }));
    for (const key of [SETTINGS_STORAGE_KEY, PLAN_STORAGE_KEY, SHOPPING_STORAGE_KEY]) expect(localStorage.getItem(key)).toBeNull();
    expect(screen.getByText("Everything has been deleted from this device.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete everything from this device" })).toBeDisabled();
  });

  it("can delete data that can't be read (a recovery path)", () => {
    localStorage.setItem(PLAN_STORAGE_KEY, "{broken");
    localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify({ version: 99 }));
    expect(deleteAllDeviceData()).toEqual({ ok: true });
    expect(localStorage.length).toBe(0);
  });
});

describe("saved data safety", () => {
  it("update refuses to overwrite a document it can't read", () => {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify({ version: 2, meals: "from the future" }));
    const { result } = renderHook(() => usePlan());
    expect(result.current.state).toEqual({ status: "invalid", reason: "newer" });
    expect(result.current.update((plan) => plan)).toEqual({ ok: false, reason: "unreadable" });
    expect(JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY)!).meals).toBe("from the future");
  });

  it("asks for a reload, not a reset, when data is from a newer version", () => {
    render(
      <ToastProvider>
        <DocumentGate
          state={{ status: "invalid", reason: "newer" }}
          reset={() => ({ ok: true })}
          copy={{ title: "Damaged", body: "x", reset: "Reset", resetDone: "y" }}
        >
          {() => null}
        </DocumentGate>
      </ToastProvider>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Saved by a newer version of the app");
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
  });
});
