import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ShoppingListView } from "@/components/shopping/shopping-list-view";
import { ToastProvider } from "@/components/ui/toast";
import { toLocalIsoDate } from "@/lib/dates";
import { addMeal, setServings, type NewMeal } from "@/lib/planner/operations";
import { emptyPlan, type MealPlan } from "@/lib/planner/schema";
import { planDocument } from "@/lib/planner/store";
import { getRecipeIngredientIndex, getRecipeSummaries } from "@/lib/recipes/catalogue";
import type { ShoppingList } from "@/lib/shopping/schema";
import { SHOPPING_STORAGE_KEY } from "@/lib/shopping/store";

const today = toLocalIsoDate();
const recipeNames = Object.fromEntries(getRecipeSummaries("en").map((r) => [r.slug, r.name]));
const ctx = { now: new Date(), newId: () => crypto.randomUUID() };

function seedPlan(...meals: NewMeal[]): MealPlan {
  const plan = meals.reduce((p, meal) => addMeal(p, meal, ctx), emptyPlan);
  planDocument.write(plan);
  return plan;
}

function stored(): ShoppingList {
  return JSON.parse(localStorage.getItem(SHOPPING_STORAGE_KEY) ?? "null") as ShoppingList;
}

function renderList() {
  return render(
    <ToastProvider>
      <ShoppingListView recipeIndex={getRecipeIngredientIndex()} recipeNames={recipeNames} />
    </ToastProvider>,
  );
}

const quinoaBowl: NewMeal = { kind: "recipe", recipeSlug: "chicken-quinoa-power-bowl", date: today, mealType: "lunch", servings: 2 };

beforeEach(() => localStorage.clear());

describe("ShoppingListView", () => {
  it("guides users to plan first when the dates have no recipes", async () => {
    renderList();
    expect(await screen.findByRole("heading", { name: "Nothing planned for these dates" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to meal plan" })).toHaveAttribute("href", expect.stringContaining("/planner?date="));
    expect(screen.queryByRole("button", { name: "Create list from plan" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your list is empty" })).toBeInTheDocument();
  });

  it("creates a grouped list with accessible checkboxes, and remembers ticks", async () => {
    seedPlan(quinoaBowl);
    const user = userEvent.setup();
    renderList();
    expect(await screen.findByText(/Adds up the ingredients of every planned recipe/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create list from plan" }));

    const meat = screen.getByRole("region", { name: "Meat and fish" });
    const chicken = within(meat).getByRole("checkbox", { name: "300 g Chicken breast" });
    expect(chicken).toHaveAccessibleDescription("For Lemon chicken quinoa bowl");
    expect(screen.getByRole("checkbox", { name: "1 tsp Dried mixed herbs" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "1 Lemon" })).toBeInTheDocument();

    await user.click(chicken);
    expect(chicken).toBeChecked();
    const total = stored().items.length;
    expect(screen.getByText(`1 of ${total} ticked`)).toBeInTheDocument();
    expect(stored().items.find((i) => i.id === "gen:chicken-breast:mass")?.checked).toBe(true);
  });

  it("notices plan changes and updates amounts while keeping ticks", async () => {
    const plan = seedPlan(quinoaBowl);
    const user = userEvent.setup();
    renderList();
    await user.click(await screen.findByRole("button", { name: "Create list from plan" }));
    await user.click(screen.getByRole("checkbox", { name: "300 g Chicken breast" }));

    act(() => {
      planDocument.write(setServings(plan, plan.meals[0]!.id, 4, ctx)); // doubles everything
    });
    expect(screen.getByText("Your plan has changed since this list was last updated.")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Update list from plan" })[0]!);

    expect(screen.getByRole("checkbox", { name: "600 g Chicken breast" })).toBeChecked();
    expect(screen.queryByText("Your plan has changed since this list was last updated.")).not.toBeInTheDocument();
  });

  it("adds, edits, and removes items (with undo)", async () => {
    seedPlan(quinoaBowl);
    const user = userEvent.setup();
    renderList();
    await user.click(await screen.findByRole("button", { name: "Create list from plan" }));

    // Manual item, sorted into "Other".
    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(screen.getByLabelText("Item")).toHaveFocus();
    await user.type(screen.getByLabelText("Item"), "Coffee");
    await user.click(screen.getByRole("button", { name: "Add item" }));
    const other = screen.getByRole("region", { name: "Other" });
    expect(within(other).getByRole("checkbox", { name: "Coffee" })).toHaveAccessibleDescription("Your item");

    // Edit a generated line: the plan's amount stays visible.
    await user.click(screen.getByRole("button", { name: "Edit 300 g Chicken breast" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Chicken breast" });
    await user.clear(within(dialog).getByLabelText("Amount"));
    await user.type(within(dialog).getByLabelText("Amount"), "0,5");
    await user.selectOptions(within(dialog).getByLabelText("Unit"), "kg");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(screen.getByRole("checkbox", { name: "0.5 kg Chicken breast" })).toHaveAccessibleDescription(
      "For Lemon chicken quinoa bowl You changed this amount. Your plan needs 300 g.",
    );

    // Remove, then undo.
    await user.click(screen.getByRole("button", { name: "Remove Coffee" }));
    expect(stored().items.some((i) => i.name === "Coffee")).toBe(false);
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(stored().items.some((i) => i.name === "Coffee")).toBe(true);
  });

  it("asks before clearing the whole list", async () => {
    seedPlan(quinoaBowl);
    const user = userEvent.setup();
    renderList();
    await user.click(await screen.findByRole("button", { name: "Create list from plan" }));
    await user.click(screen.getByRole("button", { name: "Clear list" }));
    const dialog = screen.getByRole("dialog", { name: "Clear the whole list?" });
    await user.click(within(dialog).getByRole("button", { name: "Clear list" }));
    expect(stored().items).toEqual([]);
    expect(screen.getByRole("heading", { name: "Your list is empty" })).toBeInTheDocument();
  });

  it("explains that custom meals aren't included", async () => {
    seedPlan(quinoaBowl, {
      kind: "custom",
      name: "Canteen lunch",
      nutritionPerServing: { kcal: 600, proteinG: 30, carbsG: null, fatG: null },
      date: today,
      mealType: "dinner",
      servings: 1,
    });
    renderList();
    expect(await screen.findByText("1 meal you added yourself isn't included, because it has no ingredient list.")).toBeInTheDocument();
  });

  it("validates custom date ranges", async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(await screen.findByRole("radio", { name: "Choose dates" }));
    await user.clear(screen.getByLabelText("To"));
    await user.type(screen.getByLabelText("To"), "2000-01-01");
    expect(screen.getByText("The end date must be on or after the start date.")).toBeInTheDocument();
  });
});
