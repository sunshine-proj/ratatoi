import { describe, expect, it } from "vitest";
import { addMeal } from "@/lib/planner/operations";
import { emptyPlan } from "@/lib/planner/schema";
import { emptySettings } from "@/lib/settings/settings";
import { emptyShoppingList } from "@/lib/shopping/schema";
import { backupFileName, buildBackup, parseBackup, BACKUP_MAX_BYTES } from "@/lib/storage/backup";

const plan = addMeal(emptyPlan, { kind: "recipe", recipeSlug: "chocolate-skyr-pot", date: "2026-11-26", mealType: "snack", servings: 1 }, { now: new Date("2026-11-24T10:00:00Z"), newId: () => "m1" });

describe("backup", () => {
  it("round-trips everything saved", () => {
    const backup = buildBackup({ settings: emptySettings, plan, shopping: emptyShoppingList }, new Date("2026-11-24T10:00:00Z"));
    expect(backup).toMatchObject({ format: "protein-plate-backup", version: 1, exportedAt: "2026-11-24T10:00:00.000Z" });
    expect(parseBackup(JSON.stringify(backup))).toEqual({
      ok: true,
      documents: { settings: emptySettings, plan, shopping: emptyShoppingList },
    });
  });

  it("allows missing documents (nothing saved yet)", () => {
    const backup = buildBackup({ settings: null, plan, shopping: null });
    expect(parseBackup(JSON.stringify(backup))).toEqual({ ok: true, documents: { settings: null, plan, shopping: null } });
  });

  it("rejects files that aren't backups, are damaged, are too large, or come from a newer version", () => {
    expect(parseBackup("not json")).toEqual({ ok: false, error: "notJson" });
    expect(parseBackup(JSON.stringify({ hello: "world" }))).toEqual({ ok: false, error: "notBackup" });
    expect(parseBackup(JSON.stringify({ format: "protein-plate-backup", version: 2, documents: {} }))).toEqual({ ok: false, error: "newer" });
    const damaged = { ...buildBackup({ settings: null, plan, shopping: null }), documents: { plan: { version: 1, meals: [{ id: 1 }] } } };
    expect(parseBackup(JSON.stringify(damaged))).toEqual({ ok: false, error: "damaged" });
    const newerDoc = { ...buildBackup({ settings: null, plan: null, shopping: null }), documents: { plan: { version: 7 } } };
    expect(parseBackup(JSON.stringify(newerDoc))).toEqual({ ok: false, error: "newer" });
    expect(parseBackup("x".repeat(BACKUP_MAX_BYTES + 1))).toEqual({ ok: false, error: "tooLarge" });
  });

  it("names files by local date", () => {
    expect(backupFileName(new Date(2026, 10, 24, 23, 30))).toBe("protein-plate-data-2026-11-24.json");
  });
});
