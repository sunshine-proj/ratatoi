import { z } from "zod";
import { beforeEach, describe, expect, it } from "vitest";
import { createLocalDocument, decodeDocument } from "@/lib/storage/local-document";

/** A made-up document whose v3 splits "name" into first/last and v2 renamed "kcal". */
const schemaV3 = z.object({ version: z.literal(3), first: z.string(), last: z.string(), energyKcal: z.number() });
const migrations = {
  1: (doc: Record<string, unknown>) => ({ ...doc, version: 2, energyKcal: doc.kcal, kcal: undefined }),
  2: (doc: Record<string, unknown>) => {
    const [first = "", last = ""] = String(doc.name).split(" ");
    return { version: 3, first, last, energyKcal: doc.energyKcal };
  },
};
const options = { version: 3, migrations };

describe("decodeDocument", () => {
  it("passes current documents through validation", () => {
    expect(decodeDocument(JSON.stringify({ version: 3, first: "A", last: "B", energyKcal: 1 }), schemaV3, options)).toEqual({
      status: "ready",
      value: { version: 3, first: "A", last: "B", energyKcal: 1 },
    });
  });

  it("upgrades older documents step by step", () => {
    const v1 = JSON.stringify({ version: 1, name: "Ada Lovelace", kcal: 1900 });
    expect(decodeDocument(v1, schemaV3, options)).toEqual({
      status: "ready",
      value: { version: 3, first: "Ada", last: "Lovelace", energyKcal: 1900 },
    });
  });

  it("reports documents from a newer version separately", () => {
    expect(decodeDocument(JSON.stringify({ version: 4 }), schemaV3, options)).toEqual({ status: "invalid", reason: "newer" });
  });

  it("reports damage: bad JSON, no version, missing migration, failed migration, failed validation", () => {
    const damaged = { status: "invalid", reason: "damaged" };
    expect(decodeDocument("{oops", schemaV3, options)).toEqual(damaged);
    expect(decodeDocument("[]", schemaV3, options)).toEqual(damaged);
    expect(decodeDocument(JSON.stringify({ first: "x" }), schemaV3, options)).toEqual(damaged);
    expect(decodeDocument(JSON.stringify({ version: 0 }), schemaV3, options)).toEqual(damaged);
    expect(decodeDocument(JSON.stringify({ version: 2, name: "A B" }), schemaV3, options)).toEqual(damaged); // energyKcal missing
    const throwing = { version: 2, migrations: { 1: () => { throw new Error("boom"); } } };
    expect(decodeDocument(JSON.stringify({ version: 1 }), z.object({ version: z.literal(2) }), throwing)).toEqual(damaged);
  });
});

describe("createLocalDocument with migrations", () => {
  beforeEach(() => localStorage.clear());

  it("reads migrated data and saves the current version on the next write", () => {
    const doc = createLocalDocument("test:doc", schemaV3, options);
    localStorage.setItem("test:doc", JSON.stringify({ version: 1, name: "Ada Lovelace", kcal: 1900 }));
    const state = doc.read();
    expect(state.status).toBe("ready");
    if (state.status !== "ready") return;
    // Reading never writes…
    expect(JSON.parse(localStorage.getItem("test:doc")!).version).toBe(1);
    // …the next save stores the upgraded document.
    doc.write(state.value);
    expect(JSON.parse(localStorage.getItem("test:doc")!)).toEqual({ version: 3, first: "Ada", last: "Lovelace", energyKcal: 1900 });
  });
});
