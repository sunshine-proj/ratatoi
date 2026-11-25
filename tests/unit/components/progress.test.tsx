import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgressPanel } from "@/components/nutrition/progress-panel";
import { TodayDashboard } from "@/components/today/today-dashboard";
import { ToastProvider } from "@/components/ui/toast";
import { DelayedAnnouncement } from "@/components/ui/delayed-announcement";
import { toLocalIsoDate } from "@/lib/dates";
import { buildGoal, type DailyTargets } from "@/lib/nutrition/goal";
import { addMeal } from "@/lib/planner/operations";
import { emptyPlan } from "@/lib/planner/schema";
import { PLAN_STORAGE_KEY } from "@/lib/planner/store";
import { defaultPreferences } from "@/lib/preferences/preferences";
import { getRecipeSummaries } from "@/lib/recipes/catalogue";
import { completeOnboarding, emptySettings, SETTINGS_STORAGE_KEY } from "@/lib/settings/settings";

const targets: DailyTargets = { dailyCalorieTargetKcal: 1900, dailyProteinTargetG: 150, dailyCarbsTargetG: 200, dailyFatTargetG: null };
const totals = (kcal: number, proteinG: number, carbsG: number | null = 0) => ({ kcal, proteinG, carbsG, fatG: 0, mealCount: 3, unknownMeals: 0 });

beforeEach(() => localStorage.clear());
afterEach(() => vi.useRealTimers());

describe("ProgressPanel", () => {
  it("states planned, target, and remaining in words, not just bars", () => {
    render(<ProgressPanel totals={totals(1700, 150)} targets={targets} headingId="p" heading="Progress" />);
    const panel = screen.getByRole("region", { name: "Progress" });
    expect(within(panel).getByText("1,700 of 1,900 kcal")).toBeInTheDocument();
    expect(within(panel).getByText("200 kcal remaining")).toBeInTheDocument();
    expect(within(panel).getByText("150 of 150 g")).toBeInTheDocument();
    expect(within(panel).getByText("0 g remaining")).toBeInTheDocument();
    expect(within(panel).getByText("Planning figures, not a judgement or medical assessment.")).toBeInTheDocument();
  });

  it("describes intake above target neutrally", () => {
    render(<ProgressPanel totals={totals(2050, 170)} targets={targets} headingId="p" heading="Progress" />);
    expect(screen.getByText("150 kcal above target")).toBeInTheDocument();
    expect(screen.getByText("20 g above target")).toBeInTheDocument();
    expect(screen.queryByText(/over|exceed|too much/i)).not.toBeInTheDocument();
  });

  it("says when a value is unknown instead of showing zero", () => {
    render(<ProgressPanel totals={totals(1700, 150, null)} targets={targets} headingId="p" heading="Progress" />);
    expect(screen.getByText("Unknown: some meals have no carbohydrate information.")).toBeInTheDocument();
  });

  it("without targets, shows planned totals and a way to set targets", () => {
    render(<ProgressPanel totals={totals(1200, 90)} targets={null} headingId="p" heading="Progress" />);
    expect(screen.getByText("Planned: 1,200 kcal · 90 g protein")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Set targets" })).toHaveAttribute("href", "/settings/goals");
  });
});

describe("DelayedAnnouncement", () => {
  it("stays quiet on first render and announces only the settled value", () => {
    vi.useFakeTimers();
    const { rerender } = render(<DelayedAnnouncement message="Day total: 100 kcal" delay={500} />);
    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("");
    rerender(<DelayedAnnouncement message="Day total: 200 kcal" delay={500} />);
    act(() => vi.advanceTimersByTime(300));
    rerender(<DelayedAnnouncement message="Day total: 300 kcal" delay={500} />);
    act(() => vi.advanceTimersByTime(300));
    expect(region).toHaveTextContent("");
    act(() => vi.advanceTimersByTime(300));
    expect(region).toHaveTextContent("Day total: 300 kcal");
  });
});

describe("TodayDashboard", () => {
  const goal = buildGoal({
    goalType: "fat_loss",
    targets: { dailyCalorieTargetKcal: 1900, dailyProteinTargetG: 150, dailyCarbsTargetG: null, dailyFatTargetG: null },
    targetSource: "manual",
    effectiveFrom: "2026-11-24",
  });

  function renderToday() {
    return render(
      <ToastProvider>
        <TodayDashboard recipes={getRecipeSummaries()} />
      </ToastProvider>,
    );
  }

  it("shows today's meals (including snacks) and progress", async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(completeOnboarding(emptySettings, { goal, preferences: defaultPreferences })));
    const today = toLocalIsoDate();
    const ctx = { now: new Date(), newId: () => crypto.randomUUID() };
    let plan = addMeal(emptyPlan, { kind: "recipe", recipeSlug: "berry-yoghurt-power-bowl", date: today, mealType: "breakfast", servings: 1 }, ctx);
    plan = addMeal(plan, { kind: "recipe", recipeSlug: "chocolate-skyr-pot", date: today, mealType: "snack", servings: 1 }, ctx);
    plan = addMeal(plan, { kind: "recipe", recipeSlug: "lemon-salmon-traybake", date: "2000-01-01", mealType: "dinner", servings: 1 }, ctx);
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
    renderToday();

    const meals = await screen.findByRole("region", { name: "Today's meals" });
    expect(meals.querySelector("ol")?.children).toHaveLength(2); // meal rows (each also holds a chip list)
    expect(within(meals).getByRole("link", { name: "Chocolate skyr pot" })).toBeInTheDocument();
    expect(within(meals).queryByText("Lemon salmon and potato traybake")).not.toBeInTheDocument();
    // 345 + 153 = 498 kcal; 30.6 + 23.6 = 54.2 g
    const progress = screen.getByRole("region", { name: "Today's progress" });
    expect(within(progress).getByText("498 of 1,900 kcal")).toBeInTheDocument();
    expect(within(progress).getByText("1,402 kcal remaining")).toBeInTheDocument();
    expect(within(progress).getByText("96 g remaining")).toBeInTheDocument();
    expect(screen.getByText(/^Good (morning|afternoon|evening)$/)).toBeInTheDocument();
  });

  it("has a useful empty state and quick actions", async () => {
    renderToday();
    expect(await screen.findByText("Nothing planned for today yet.")).toBeInTheDocument();
    const today = toLocalIsoDate();
    expect(screen.getByRole("link", { name: "Plan today" })).toHaveAttribute("href", `/planner?date=${today}`);
    const actions = screen.getByRole("navigation", { name: "Quick actions" });
    expect(within(actions).getByRole("link", { name: "Add a meal" })).toHaveAttribute("href", `/planner?date=${today}`);
    expect(within(actions).getByRole("link", { name: "Find a snack" })).toHaveAttribute("href", "/snacks");
    expect(within(actions).getByRole("link", { name: "Shopping list" })).toHaveAttribute("href", "/shopping-list");
  });
});
