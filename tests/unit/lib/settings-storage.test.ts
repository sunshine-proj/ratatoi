import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildGoal } from "@/lib/nutrition/goal";
import { defaultPreferences } from "@/lib/preferences/preferences";
import {
  completeOnboarding,
  emptySettings,
  SETTINGS_STORAGE_KEY,
  settingsDocument,
  withGoal,
} from "@/lib/settings/settings";

const goal = buildGoal({
  goalType: "muscle_gain",
  targets: { dailyCalorieTargetKcal: 2600, dailyProteinTargetG: 160, dailyCarbsTargetG: null, dailyFatTargetG: null },
  targetSource: "estimate",
  effectiveFrom: "2026-11-24",
});

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("settings document", () => {
  it("is empty when nothing is saved", () => {
    expect(settingsDocument.read()).toEqual({ status: "empty" });
  });

  it("saves and reads back validated settings", () => {
    const settings = completeOnboarding(emptySettings, { goal, preferences: defaultPreferences });
    expect(settingsDocument.write(settings)).toEqual({ ok: true });
    const state = settingsDocument.read();
    expect(state).toEqual({ status: "ready", value: settings });
  });

  it("returns the same snapshot object until storage changes", () => {
    settingsDocument.write(withGoal(emptySettings, goal));
    const first = settingsDocument.read();
    expect(settingsDocument.read()).toBe(first);
    settingsDocument.write(withGoal(emptySettings, null));
    expect(settingsDocument.read()).not.toBe(first);
  });

  it("reports damaged or unknown data as invalid instead of trusting it", () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, "{not json");
    expect(settingsDocument.read()).toEqual({ status: "invalid", reason: "damaged" });
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ version: 1, goal: "nope" }));
    expect(settingsDocument.read()).toEqual({ status: "invalid", reason: "damaged" });
    // From a newer app version: reported separately so it is never reset.
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ version: 99 }));
    expect(settingsDocument.read()).toEqual({ status: "invalid", reason: "newer" });
  });

  it("refuses to write values that fail validation", () => {
    const bad = withGoal(emptySettings, { ...goal, dailyProteinTargetG: -1 });
    expect(settingsDocument.write(bad)).toEqual({ ok: false, reason: "invalid" });
    expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
  });

  it("reports when storage is full or blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    expect(settingsDocument.write(emptySettings)).toEqual({ ok: false, reason: "unavailable" });
  });

  it("notifies subscribers in the same tab and clears", () => {
    const listener = vi.fn();
    const unsubscribe = settingsDocument.subscribe(listener);
    settingsDocument.write(emptySettings);
    settingsDocument.clear();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(settingsDocument.read()).toEqual({ status: "empty" });
    unsubscribe();
  });

  it("never stores profile details used for estimates", () => {
    settingsDocument.write(completeOnboarding(emptySettings, { goal, preferences: defaultPreferences }));
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "";
    for (const key of ["age", "weight", "height", "sex", "activity"]) expect(raw).not.toContain(`"${key}`);
  });
});
