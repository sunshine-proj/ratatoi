import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddToPlanButton } from "@/components/planner/add-to-plan-button";
import { PlannerView } from "@/components/planner/planner-view";
import { ToastProvider } from "@/components/ui/toast";
import { toLocalIsoDate } from "@/lib/dates";
import { addMeal, type NewMeal } from "@/lib/planner/operations";
import { emptyPlan, type MealPlan } from "@/lib/planner/schema";
import { PLAN_STORAGE_KEY } from "@/lib/planner/store";
import { getRecipeSummaries } from "@/lib/recipes/catalogue";

const DATE = "2026-11-26"; // a Thursday
const nav = { replace: vi.fn(), push: vi.fn(), search: `date=${DATE}` };
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  usePathname: () => "/planner",
  useSearchParams: () => new URLSearchParams(nav.search),
}));

const recipes = getRecipeSummaries();

function seed(...meals: NewMeal[]) {
  let n = 0;
  const ctx = { now: new Date("2026-11-24T10:00:00Z"), newId: () => `seed-${++n}` };
  const plan = meals.reduce((p, meal) => addMeal(p, meal, ctx), emptyPlan);
  localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
}

function storedPlan(): MealPlan {
  return JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) ?? "null") as MealPlan;
}

function renderPlanner() {
  return render(
    <ToastProvider>
      <PlannerView recipes={recipes} />
    </ToastProvider>,
  );
}

const slot = (name: string) => screen.getByRole("region", { name });

beforeEach(() => {
  localStorage.clear();
  nav.replace.mockReset();
  nav.push.mockReset();
  nav.search = `date=${DATE}`;
});

describe("PlannerView", () => {
  it("shows the selected day with four slots that can stay empty", async () => {
    renderPlanner();
    expect(await screen.findByRole("heading", { level: 2, name: /Thursday 26 November/ })).toBeInTheDocument();
    expect(screen.getByText(/Nothing planned yet/)).toBeInTheDocument();
    for (const name of ["Breakfast", "Lunch", "Dinner", "Snacks"]) {
      expect(within(slot(name)).getByText("Nothing planned")).toBeInTheDocument();
    }
    expect(screen.getByRole("tab", { name: /Thursday 26 November/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByRole("tab")).toHaveLength(7);
  });

  it("adds a recipe with servings and shows the day's totals", async () => {
    const user = userEvent.setup();
    renderPlanner();
    await user.click(await screen.findByRole("button", { name: "Add lunch" }));
    const dialog = screen.getByRole("dialog", { name: "Add lunch for Thu 26 Nov" });
    await user.click(within(dialog).getByRole("button", { name: "More servings" }));
    await user.type(within(dialog).getByLabelText("Search recipes"), "tuna");
    await user.click(within(dialog).getByRole("button", { name: "Add Tuna and chickpea salad" }));

    expect(storedPlan().meals).toMatchObject([{ recipeSlug: "tuna-chickpea-salad", servings: 1.5, mealType: "lunch", date: DATE }]);
    expect(within(slot("Lunch")).getByRole("link", { name: "Tuna and chickpea salad" })).toBeInTheDocument();
    // 403 kcal × 1.5 = 604.5; 41.4 g × 1.5 = 62.1 g
    expect(screen.getByText("Planned: 605 kcal · 62 g protein")).toBeInTheDocument();
  });

  it("supports several snacks in one day", async () => {
    seed(
      { kind: "recipe", recipeSlug: "chocolate-skyr-pot", date: DATE, mealType: "snack", servings: 1 },
      { kind: "recipe", recipeSlug: "chilli-lemon-edamame", date: DATE, mealType: "snack", servings: 1 },
    );
    renderPlanner();
    const snacks = await screen.findByRole("region", { name: "Snacks" });
    expect(within(snacks).getAllByRole("article")).toHaveLength(2);
    expect(within(snacks).getByRole("button", { name: "Add snack" })).toBeInTheDocument();
  });

  it("changes servings and recalculates totals", async () => {
    seed({ kind: "recipe", recipeSlug: "chocolate-skyr-pot", date: DATE, mealType: "snack", servings: 1 });
    const user = userEvent.setup();
    renderPlanner();
    expect(await screen.findByText("Planned: 159 kcal · 23 g protein")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "More servings of Chocolate skyr pot" }));
    expect(screen.getByText("Planned: 239 kcal · 35 g protein")).toBeInTheDocument();
    expect(storedPlan().meals[0]?.servings).toBe(1.5);
  });

  it("removes a meal with an Undo", async () => {
    seed({ kind: "recipe", recipeSlug: "chocolate-skyr-pot", date: DATE, mealType: "snack", servings: 1 });
    const user = userEvent.setup();
    renderPlanner();
    await user.click(await screen.findByRole("button", { name: "Remove: Chocolate skyr pot" }));
    expect(storedPlan().meals).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(storedPlan().meals).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Chocolate skyr pot" })).toBeInTheDocument();
  });

  it("previews how a swap changes the day's totals", async () => {
    seed({ kind: "recipe", recipeSlug: "tuna-chickpea-salad", date: DATE, mealType: "lunch", servings: 1 });
    const user = userEvent.setup();
    renderPlanner();
    await user.click(await screen.findByRole("button", { name: "Swap: Tuna and chickpea salad" }));
    const dialog = screen.getByRole("dialog", { name: "Swap Tuna and chickpea salad" });
    expect(within(dialog).getByText("Day now: 403 kcal · 41 g protein")).toBeInTheDocument();
    // Wraps: 446 kcal, 36.7 g → +43 kcal, −5 g (rounded from −4.7)
    expect(within(dialog).getByText("Day after: 446 kcal (+43 kcal) · 37 g protein (−5 g)")).toBeInTheDocument();
    expect(within(dialog).queryByText("Tuna and chickpea salad", { selector: "span" })).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Swap in Smoky chicken and hummus wraps" }));
    expect(storedPlan().meals[0]).toMatchObject({ recipeSlug: "chicken-hummus-wraps", id: "seed-1" });
    expect(screen.getByText("Planned: 446 kcal · 37 g protein")).toBeInTheDocument();
  });

  it("adds a custom meal, marked as the user's own entry", async () => {
    const user = userEvent.setup();
    renderPlanner();
    await user.click(await screen.findByRole("button", { name: "Add dinner" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("tab", { name: "Your own meal" }));
    await user.click(within(dialog).getByRole("button", { name: "Add meal" }));
    expect(within(dialog).getByLabelText("Meal name")).toHaveFocus();
    expect(within(dialog).getAllByText("This field is required.")).toHaveLength(3);

    await user.type(within(dialog).getByLabelText("Meal name"), "Canteen curry");
    await user.type(within(dialog).getByLabelText("Calories per serving (kcal)"), "720");
    await user.type(within(dialog).getByLabelText("Protein per serving (g)"), "32");
    await user.click(within(dialog).getByRole("button", { name: "Add meal" }));

    expect(storedPlan().meals[0]).toMatchObject({
      kind: "custom",
      name: "Canteen curry",
      nutritionPerServing: { kcal: 720, proteinG: 32, carbsG: null, fatG: null },
    });
    const dinner = slot("Dinner");
    expect(within(dinner).getByText("Your own meal")).toBeInTheDocument();
    expect(within(dinner).getByText(/not a verified recipe/)).toBeInTheDocument();
  });

  it("asks before clearing a day", async () => {
    seed(
      { kind: "recipe", recipeSlug: "chocolate-skyr-pot", date: DATE, mealType: "snack", servings: 1 },
      { kind: "recipe", recipeSlug: "tuna-chickpea-salad", date: DATE, mealType: "lunch", servings: 1 },
      { kind: "recipe", recipeSlug: "tuna-chickpea-salad", date: "2026-11-27", mealType: "lunch", servings: 1 },
    );
    const user = userEvent.setup();
    renderPlanner();
    await user.click(await screen.findByRole("button", { name: "Clear day" }));
    const dialog = screen.getByRole("dialog", { name: "Clear Thu 26 Nov?" });
    expect(dialog).toHaveAccessibleDescription("This removes 2 planned meals from Thu 26 Nov.");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(storedPlan().meals).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "Clear day" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Clear day" }));
    expect(storedPlan().meals.map((m) => m.date)).toEqual(["2026-11-27"]);
  });

  it("navigates days and weeks through the URL", async () => {
    const user = userEvent.setup();
    renderPlanner();
    await user.click(await screen.findByRole("tab", { name: /Friday 27 November/ }));
    expect(nav.replace).toHaveBeenLastCalledWith("/planner?date=2026-11-27", { scroll: false });
    await user.click(screen.getByRole("button", { name: "Next week" }));
    expect(nav.replace).toHaveBeenLastCalledWith("/planner?date=2026-11-30", { scroll: false });
    await user.click(screen.getByRole("button", { name: "Previous week" }));
    expect(nav.replace).toHaveBeenLastCalledWith("/planner?date=2026-11-16", { scroll: false });
  });

  it("explains an unreadable saved plan and refuses to overwrite it silently", async () => {
    localStorage.setItem(PLAN_STORAGE_KEY, "{broken");
    const user = userEvent.setup();
    renderPlanner();
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't read your saved meal plan");
    await user.click(screen.getByRole("button", { name: "Reset meal plan" }));
    expect(localStorage.getItem(PLAN_STORAGE_KEY)).toBeNull();
    expect(await screen.findByText(/Nothing planned yet/)).toBeInTheDocument();
  });
});

describe("AddToPlanButton", () => {
  it("adds a recipe to a chosen meal today and offers to view the plan", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <AddToPlanButton recipe={{ slug: "lemon-salmon-traybake", name: "Lemon salmon and potato traybake", mealTypes: ["dinner"] }} />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Add to plan" }));
    const dialog = screen.getByRole("dialog", { name: "Add Lemon salmon and potato traybake to your plan" });
    expect(within(dialog).getByRole("radio", { name: "Dinner" })).toBeChecked();
    await user.click(within(dialog).getByRole("button", { name: "Add to plan" }));

    const today = toLocalIsoDate();
    expect(storedPlan().meals).toMatchObject([{ recipeSlug: "lemon-salmon-traybake", date: today, mealType: "dinner", servings: 1 }]);
    await user.click(screen.getByRole("button", { name: "View plan" }));
    expect(nav.push).toHaveBeenCalledWith(`/planner?date=${today}`);
  });
});
