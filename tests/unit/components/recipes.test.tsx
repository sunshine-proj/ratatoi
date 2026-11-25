import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { RecipeBrowser } from "@/components/recipes/recipe-browser";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { RecipeDetail } from "@/components/recipes/recipe-detail";
import { ToastProvider } from "@/components/ui/toast";
import { defaultPreferences } from "@/lib/preferences/preferences";
import { getRecipeDetail, getRecipeSummaries } from "@/lib/recipes/catalogue";
import { emptySettings, SETTINGS_STORAGE_KEY, withPreferences } from "@/lib/settings/settings";

const recipes = getRecipeSummaries();
const snacks = recipes.filter((r) => r.mealTypes.includes("snack"));

function renderBrowser(mode: "all" | "snacks" = "all") {
  return render(
    <ToastProvider>
      <RecipeBrowser recipes={mode === "all" ? recipes : snacks} mode={mode} />
    </ToastProvider>,
  );
}

function results() {
  const list = screen.queryAllByRole("list").find((el) => el.querySelector("article"));
  return list ? within(list).getAllByRole("article") : [];
}

beforeEach(() => localStorage.clear());

describe("RecipeCard", () => {
  it("is a single link with name, protein, calories, time, and an estimate note", () => {
    const recipe = recipes.find((r) => r.slug === "chocolate-skyr-pot")!;
    render(<RecipeCard recipe={recipe} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Chocolate skyr pot" })).toHaveAttribute("href", "/recipes/chocolate-skyr-pot");
    expect(screen.getByText("24 g protein")).toBeInTheDocument();
    expect(screen.getByText("153 kcal")).toBeInTheDocument();
    expect(screen.getByText("3 min")).toBeInTheDocument();
    expect(screen.getByText("Per serving, estimated")).toBeInTheDocument();
    expect(screen.getByText("Under 200 kcal")).toBeInTheDocument();
  });
});

describe("RecipeBrowser", () => {
  it("shows every recipe with a live count", async () => {
    renderBrowser();
    expect(await screen.findByText(`${recipes.length} recipes`)).toBeInTheDocument();
    expect(results()).toHaveLength(recipes.length);
  });

  it("searches by ingredient", async () => {
    const user = userEvent.setup();
    renderBrowser();
    await user.type(await screen.findByLabelText("Search recipes"), "salmon");
    expect(screen.getByText("2 recipes")).toBeInTheDocument();
  });

  it("filters by protein with an inclusive bound and shows a removable chip", async () => {
    const user = userEvent.setup();
    renderBrowser();
    const protein = (await screen.findAllByLabelText("Protein at least (g)"))[0]!;
    await user.type(protein, "45");
    const expected = recipes.filter((r) => r.nutritionPerServing.proteinG >= 45).length;
    expect(screen.getByText(`${expected} recipes`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove filter: 45 g+ protein" }));
    expect(screen.getByText(`${recipes.length} recipes`)).toBeInTheDocument();
  });

  it("flags an invalid number instead of hiding everything", async () => {
    const user = userEvent.setup();
    renderBrowser();
    const calories = (await screen.findAllByLabelText("Calories at most (kcal)"))[0]!;
    await user.type(calories, "lots");
    expect(calories).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(`${recipes.length} recipes`)).toBeInTheDocument();
  });

  it("offers a reset when nothing matches", async () => {
    const user = userEvent.setup();
    renderBrowser();
    await user.type(await screen.findByLabelText("Search recipes"), "unicorn");
    expect(screen.getByRole("heading", { name: "No recipes match" })).toBeInTheDocument();
    await user.click(within(screen.getByRole("heading", { name: "No recipes match" }).parentElement!).getByRole("button", { name: "Clear filters" }));
    expect(screen.getByLabelText("Search recipes")).toHaveValue("");
    expect(results()).toHaveLength(recipes.length);
  });

  it("applies saved preferences by default, shows them, and lets users turn them off", async () => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(withPreferences(emptySettings, { ...defaultPreferences, allergens: ["milk"], excludedIngredients: ["tofu"] })),
    );
    const user = userEvent.setup();
    renderBrowser();

    const toggle = await screen.findByRole("checkbox", { name: "Hide recipes that don't suit my preferences" });
    expect(toggle).toBeChecked();
    expect(screen.getByText(/Hiding: Milk, tofu/)).toBeInTheDocument();
    const visible = recipes.filter(
      (r) => !r.allergens.includes("milk") && !r.ingredientNames.some((names) => names.includes("Firm tofu")),
    );
    expect(results()).toHaveLength(visible.length);
    expect(screen.queryByRole("link", { name: "Chocolate skyr pot" })).not.toBeInTheDocument();

    await user.click(toggle);
    expect(results()).toHaveLength(recipes.length);
    expect(screen.getByRole("link", { name: "Edit preferences" })).toHaveAttribute("href", "/settings/preferences");
  });

  it("snack presets set editable calorie and protein limits", async () => {
    const user = userEvent.setup();
    renderBrowser("snacks");
    expect(await screen.findByRole("radio", { name: "All snacks" })).toBeChecked();
    expect(screen.queryByRole("group", { name: "Meal" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Up to 200 kcal, 20 g+ protein" }));
    const expected = snacks.filter((r) => r.nutritionPerServing.kcal <= 200 && r.nutritionPerServing.proteinG >= 20);
    expect(results()).toHaveLength(expected.length);
    expect(screen.getAllByLabelText("Calories at most (kcal)")[0]).toHaveValue("200");

    // Editing a number moves off the preset.
    await user.clear(screen.getAllByLabelText("Calories at most (kcal)")[0]!);
    await user.type(screen.getAllByLabelText("Calories at most (kcal)")[0]!, "220");
    expect(screen.getByRole("radio", { name: "Up to 200 kcal, 20 g+ protein" })).not.toBeChecked();
  });
});

describe("RecipeDetail", () => {
  it("shows nutrition, ingredients, method, allergens, and sources", () => {
    const recipe = getRecipeDetail("spinach-feta-egg-scramble")!;
    render(<RecipeDetail recipe={recipe} />);

    expect(screen.getByRole("heading", { level: 1, name: "Spinach and feta egg scramble" })).toBeInTheDocument();
    const nutrition = screen.getByRole("region", { name: "Nutrition per serving" });
    expect(within(nutrition).getByText("Estimated")).toBeInTheDocument();
    expect(within(nutrition).getByText("34 g")).toBeInTheDocument();
    expect(within(nutrition).getByText("418 kcal")).toBeInTheDocument();

    const ingredients = screen.getByRole("region", { name: "Ingredients" });
    expect(within(ingredients).getByText("1 slice")).toBeInTheDocument();
    expect(within(ingredients).getByText("100 ml")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Method" })).getAllByRole("listitem")).toHaveLength(4);

    expect(screen.getByText("Contains: Cereals containing gluten, Eggs, Milk.")).toBeInTheDocument();
    expect(screen.getByText(/always check the labels/)).toBeInTheDocument();
    expect(screen.getByText(/the picture is an illustration/)).toBeInTheDocument();
    expect(screen.getByText(/High protein: at least 20% of the energy/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All recipes" })).toHaveAttribute("href", "/recipes");
  });
});
