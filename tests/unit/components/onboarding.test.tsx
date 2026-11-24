import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GoalsSettings } from "@/components/goals/goals-settings";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { PreferencesSettings } from "@/components/preferences/preferences-settings";
import { TodayOverview } from "@/components/today/today-overview";
import { ToastProvider } from "@/components/ui/toast";
import { buildGoal } from "@/lib/nutrition/goal";
import { defaultPreferences } from "@/lib/preferences/preferences";
import { completeOnboarding, emptySettings, SETTINGS_STORAGE_KEY, type UserSettings } from "@/lib/settings/settings";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function wrap(ui: ReactNode) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

function saved(): UserSettings | null {
  const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as UserSettings) : null;
}

function seed(settings: UserSettings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

const goal = buildGoal({
  goalType: "fat_loss",
  targets: { dailyCalorieTargetKcal: 1900, dailyProteinTargetG: 150, dailyCarbsTargetG: null, dailyFatTargetG: null },
  targetSource: "manual",
  effectiveFrom: "2026-11-24",
});

beforeEach(() => {
  localStorage.clear();
  push.mockReset();
});

describe("OnboardingWizard", () => {
  it("walks through estimate → targets → preferences → save", async () => {
    const user = userEvent.setup();
    wrap(<OnboardingWizard />);

    // Step 1: goal is required.
    await user.click(await screen.findByRole("button", { name: "Continue" }));
    expect(screen.getByText("Choose one option.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Lose fat, keep muscle/ })).toHaveFocus();
    await user.click(screen.getByRole("radio", { name: /Lose fat, keep muscle/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 2: profile → estimate.
    expect(screen.getByRole("heading", { level: 2, name: "About you" })).toHaveFocus();
    expect(screen.getByText(/not saved/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Estimate my targets" }));
    expect(screen.getByLabelText("Age (years)")).toHaveFocus();
    expect(screen.getByLabelText("Age (years)")).toHaveAttribute("aria-invalid", "true");

    await user.type(screen.getByLabelText("Age (years)"), "30");
    await user.type(screen.getByLabelText("Height (cm)"), "165");
    await user.type(screen.getByLabelText("Weight (kg)"), "65");
    await user.click(screen.getByRole("radio", { name: "Female" }));
    await user.click(screen.getByRole("radio", { name: /Moderately active/ }));
    await user.click(screen.getByRole("button", { name: "Estimate my targets" }));

    const result = screen.getByRole("region", { name: "Your estimated starting point" });
    expect(result).toHaveTextContent("1,800 kcal a day");
    expect(result).toHaveTextContent("115 g protein a day");
    expect(result).toHaveTextContent("Mifflin–St Jeor");
    await user.click(within(result).getByRole("button", { name: "Use these targets" }));

    // Step 3: targets prefilled from the estimate, still editable.
    expect(screen.getByLabelText("Calories (kcal)")).toHaveValue("1800");
    expect(screen.getByLabelText("Protein (g)")).toHaveValue("115");
    await user.clear(screen.getByLabelText("Protein (g)"));
    await user.type(screen.getByLabelText("Protein (g)"), "130");
    expect(screen.getByText(/not medical advice/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 4: preferences.
    await user.click(screen.getByRole("checkbox", { name: "Vegetarian" }));
    await user.click(screen.getByRole("checkbox", { name: "Peanuts" }));
    await user.type(screen.getByLabelText("Other ingredients to avoid"), "Mushrooms{Enter}");
    expect(screen.getByRole("list", { name: "Ingredients to avoid" })).toHaveTextContent("mushrooms");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    // Step 5: summary, then save.
    expect(screen.getByText("1,800 kcal")).toBeInTheDocument();
    expect(screen.getByText("130 g protein")).toBeInTheDocument();
    expect(screen.getByText("Started from an estimate")).toBeInTheDocument();
    expect(screen.getByText(/Saved in this browser on this device only/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save and finish" }));

    const stored = saved();
    expect(stored?.goal).toMatchObject({
      goalType: "fat_loss",
      dailyCalorieTargetKcal: 1800,
      dailyProteinTargetG: 130,
      dailyCarbsTargetG: null,
      targetSource: "estimate",
    });
    expect(stored?.preferences).toMatchObject({
      dietaryPatterns: ["vegetarian"],
      allergens: ["peanuts"],
      excludedIngredients: ["mushrooms"],
    });
    expect(stored?.onboardingCompletedAt).toBeTruthy();
    expect(JSON.stringify(stored)).not.toMatch(/"(age|weight|height|sex)/);
    expect(push).toHaveBeenCalledWith("/");
  });

  it("lets users skip the profile and requires targets", async () => {
    const user = userEvent.setup();
    wrap(<OnboardingWizard />);
    await user.click(await screen.findByRole("radio", { name: /Build muscle/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Skip, I'll enter my own targets" }));

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("Calories (kcal)")).toHaveFocus();
    expect(screen.getAllByText("This field is required.")).toHaveLength(2);

    await user.type(screen.getByLabelText("Calories (kcal)"), "1100");
    await user.type(screen.getByLabelText("Protein (g)"), "120");
    expect(screen.getByText(/lower than most adults need/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { level: 2, name: "Food preferences" })).toBeInTheDocument();
  });

  it("goes back without losing answers", async () => {
    const user = userEvent.setup();
    wrap(<OnboardingWizard />);
    await user.click(await screen.findByRole("radio", { name: /Eat more protein/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("radio", { name: /Eat more protein/ })).toBeChecked();
  });

  it("prefills saved answers when run again", async () => {
    seed(completeOnboarding(emptySettings, { goal, preferences: defaultPreferences }));
    wrap(<OnboardingWizard />);
    expect(await screen.findByText(/You've set things up before/)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Lose fat, keep muscle/ })).toBeChecked();
  });
});

describe("GoalsSettings", () => {
  it("edits and saves targets", async () => {
    seed(completeOnboarding(emptySettings, { goal, preferences: defaultPreferences }));
    const user = userEvent.setup();
    wrap(<GoalsSettings />);

    const calories = await screen.findByLabelText("Calories (kcal)");
    expect(calories).toHaveValue("1900");
    await user.clear(calories);
    await user.type(calories, "2,000");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(saved()?.goal?.dailyCalorieTargetKcal).toBe(2000);
    expect(screen.getByRole("status")).toHaveTextContent("Targets saved.");
  });

  it("asks before clearing targets, and keeps preferences", async () => {
    seed(completeOnboarding(emptySettings, { goal, preferences: { ...defaultPreferences, allergens: ["milk"] } }));
    const user = userEvent.setup();
    wrap(<GoalsSettings />);

    await user.click(await screen.findByRole("button", { name: "Clear targets" }));
    const dialog = screen.getByRole("dialog", { name: "Clear your targets?" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(saved()?.goal).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Clear targets" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Clear targets" }));
    expect(saved()?.goal).toBeNull();
    expect(saved()?.preferences.allergens).toEqual(["milk"]);
    expect(screen.getByLabelText("Calories (kcal)")).toHaveValue("");
  });

  it("fills targets from the estimate dialog without saving profile details", async () => {
    const user = userEvent.setup();
    wrap(<GoalsSettings />);
    expect(await screen.findByText(/haven't set any targets yet/)).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /Lose fat, keep muscle/ }));
    await user.click(screen.getByRole("button", { name: "Estimate from my details" }));
    const dialog = screen.getByRole("dialog", { name: "Estimate your targets" });
    await user.type(within(dialog).getByLabelText("Age (years)"), "30");
    await user.type(within(dialog).getByLabelText("Height (cm)"), "165");
    await user.type(within(dialog).getByLabelText("Weight (kg)"), "65");
    await user.click(within(dialog).getByRole("radio", { name: "Female" }));
    await user.click(within(dialog).getByRole("radio", { name: /Moderately active/ }));
    await user.click(within(dialog).getByRole("button", { name: "Estimate my targets" }));
    await user.click(within(dialog).getByRole("button", { name: "Use these targets" }));

    expect(screen.getByLabelText("Calories (kcal)")).toHaveValue("1800");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(saved()?.goal).toMatchObject({ dailyCalorieTargetKcal: 1800, dailyProteinTargetG: 115, targetSource: "estimate" });
  });
});

describe("PreferencesSettings", () => {
  it("saves preferences without touching targets", async () => {
    seed(completeOnboarding(emptySettings, { goal, preferences: defaultPreferences }));
    const user = userEvent.setup();
    wrap(<PreferencesSettings />);

    await user.click(await screen.findByRole("checkbox", { name: "Sesame" }));
    await user.selectOptions(screen.getByLabelText("Snacks a day"), "3");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(saved()?.preferences).toMatchObject({ allergens: ["sesame"], snacksPerDay: 3 });
    expect(saved()?.goal?.dailyCalorieTargetKcal).toBe(1900);
  });

  it("rejects duplicate ingredients with a clear message", async () => {
    const user = userEvent.setup();
    wrap(<PreferencesSettings />);
    const input = await screen.findByLabelText("Other ingredients to avoid");
    await user.type(input, "tuna{Enter}");
    await user.type(input, "Tuna{Enter}");
    expect(screen.getByText("“tuna” is already on your list.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove tuna" }));
    expect(screen.queryByRole("list", { name: "Ingredients to avoid" })).not.toBeInTheDocument();
  });
});

describe("TodayOverview and saved-data states", () => {
  it("invites new users to set up", async () => {
    wrap(<TodayOverview />);
    expect(await screen.findByRole("link", { name: "Set up your plan" })).toHaveAttribute("href", "/onboarding");
  });

  it("shows saved targets", async () => {
    seed(completeOnboarding(emptySettings, { goal, preferences: defaultPreferences }));
    wrap(<TodayOverview />);
    expect(await screen.findByText("1,900 kcal")).toBeInTheDocument();
    expect(screen.getByText("150 g protein")).toBeInTheDocument();
  });

  it("explains unreadable saved data and offers a reset", async () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, "{broken");
    const user = userEvent.setup();
    wrap(<TodayOverview />);
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't read your saved settings");
    await user.click(screen.getByRole("button", { name: "Reset saved settings" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Set up your plan" })).toBeInTheDocument());
    expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
  });
});
