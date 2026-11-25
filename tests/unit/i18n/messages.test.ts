import { describe, expect, it } from "vitest";
import {
  defaultLocale,
  isLocale,
  localePath,
  locales,
  matchAcceptLanguage,
  splitLocale,
  type PluralForms,
} from "@/lib/i18n";
import { getMessages } from "@/lib/i18n/catalogue";
import { formatDate, formatNumber, formatPlural } from "@/lib/i18n/format";
import { fatalErrorMessages } from "@/lib/i18n/messages/fatal-error";

const isPlural = (value: unknown): value is PluralForms =>
  value !== null && typeof value === "object" && "one" in value && "other" in value;

/** Leaf strings by path; plural forms are one leaf each. */
function collect(value: unknown, path = ""): Array<[string, unknown]> {
  if (value !== null && typeof value === "object" && !isPlural(value)) {
    return Object.entries(value).flatMap(([key, child]) => collect(child, path ? `${path}.${key}` : key));
  }
  return [[path, value]];
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const english = new Map(collect(getMessages("en")));

describe("locales and paths", () => {
  it("supports English, Latvian, Lithuanian, and Estonian, defaulting to English", () => {
    expect(locales).toEqual(["en", "lv", "lt", "et"]);
    expect(defaultLocale).toBe("en");
    expect(isLocale("lt")).toBe(true);
    expect(isLocale("xx")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("prefixes every locale except English", () => {
    expect(localePath("en", "/recipes")).toBe("/recipes");
    expect(localePath("lt", "/")).toBe("/lt");
    expect(localePath("lv", "/planner?date=2026-11-25")).toBe("/lv/planner?date=2026-11-25");
    expect(localePath("et", "#main")).toBe("#main");
  });

  it("splits a pathname into locale and path", () => {
    expect(splitLocale("/lt/recipes/x")).toEqual({ locale: "lt", path: "/recipes/x", prefixed: true });
    expect(splitLocale("/et")).toEqual({ locale: "et", path: "/", prefixed: true });
    expect(splitLocale("/recipes")).toEqual({ locale: "en", path: "/recipes", prefixed: false });
    // The internal path of English pages (what usePathname reports there).
    expect(splitLocale("/en/planner")).toEqual({ locale: "en", path: "/planner", prefixed: true });
    // "/lts" is not a locale prefix.
    expect(splitLocale("/lts")).toEqual({ locale: "en", path: "/lts", prefixed: false });
  });

  it("picks the best supported language from Accept-Language", () => {
    expect(matchAcceptLanguage("lt-LT,lt;q=0.9,en-US;q=0.8")).toBe("lt");
    expect(matchAcceptLanguage("ru-RU,ru;q=0.9,et;q=0.8,en;q=0.7")).toBe("et");
    expect(matchAcceptLanguage("en;q=0.5,lv;q=0.9")).toBe("lv");
    expect(matchAcceptLanguage("de-DE,fr;q=0.8")).toBeNull();
    expect(matchAcceptLanguage("lv;q=0")).toBeNull();
    expect(matchAcceptLanguage(null)).toBeNull();
  });
});

describe("message catalogues", () => {
  it.each(locales)("%s has the same keys as English, with non-empty text", (locale) => {
    const messages = new Map(collect(getMessages(locale)));
    expect([...messages.keys()].sort()).toEqual([...english.keys()].sort());
    for (const [key, value] of messages) {
      const forms = isPlural(value) ? Object.values(value) : [value];
      for (const form of forms) {
        expect(typeof form, key).toBe("string");
        expect((form as string).trim(), key).not.toBe("");
      }
    }
  });

  it.each(locales)("%s knows its own locale", (locale) => {
    expect(getMessages(locale).meta.locale).toBe(locale);
  });

  it.each(locales)("%s keeps every placeholder of the English text", (locale) => {
    for (const [key, value] of collect(getMessages(locale))) {
      const source = english.get(key);
      const sourceForms = isPlural(source) ? Object.values(source) : [source];
      const expected = placeholders(String(sourceForms.at(-1)));
      const forms = isPlural(value) ? Object.values(value) : [value];
      for (const form of forms) expect(placeholders(String(form)), key).toEqual(expected);
    }
  });

  it.each(locales.filter((l) => l !== "en"))("%s is actually translated, not a copy of English", (locale) => {
    const messages = collect(getMessages(locale));
    const same = messages.filter(([key, value]) => key !== "meta.locale" && JSON.stringify(value) === JSON.stringify(english.get(key)));
    // Brand names and units ("Protein Plate", "kcal", "g") legitimately stay the same.
    expect(same.length / messages.length).toBeLessThan(0.1);
  });

  it("gives Lithuanian and Latvian the plural forms their grammar needs", () => {
    for (const [key, value] of collect(getMessages("lt"))) {
      if (isPlural(value)) {
        expect(value.few, `lt ${key}`).toBeDefined();
        expect(value.many, `lt ${key}`).toBeDefined();
      }
    }
    for (const [key, value] of collect(getMessages("lv"))) {
      if (isPlural(value)) expect(value.zero, `lv ${key}`).toBeDefined();
    }
  });

  it.each(locales)("%s error-page strings match the fallback used when the whole page fails", (locale) => {
    expect(fatalErrorMessages[locale]).toEqual(getMessages(locale).pages.error);
  });
});

describe("formatting", () => {
  it("uses each language's number format", () => {
    expect(formatNumber(1900, "en")).toBe("1,900");
    expect(formatNumber(2.5, "lt", 1)).toBe("2,5");
    // Grouped with a non-breaking space, so numbers never wrap.
    expect(formatNumber(12500, "lt")).toBe("12\u00a0500");
    expect(formatNumber(2.5, "et", 1)).toBe("2,5");
    expect(formatNumber(2.5, "lv", 1)).toBe("2,5");
  });

  it("picks the right Lithuanian plural form", () => {
    const forms = { one: "{count} receptas", few: "{count} receptai", many: "{count} recepto", other: "{count} receptų" };
    expect(formatPlural(forms, 1, "lt")).toBe("1 receptas");
    expect(formatPlural(forms, 21, "lt")).toBe("21 receptas");
    expect(formatPlural(forms, 3, "lt")).toBe("3 receptai");
    expect(formatPlural(forms, 10, "lt")).toBe("10 receptų");
    expect(formatPlural(forms, 0, "lt")).toBe("0 receptų");
    expect(formatPlural(forms, 1.5, "lt")).toBe("1,5 recepto");
  });

  it("uses the Latvian zero form, and falls back to other when a form is missing", () => {
    const forms = { zero: "{count} receptes", one: "{count} recepte", other: "{count} receptes" };
    expect(formatPlural(forms, 0, "lv")).toBe("0 receptes");
    expect(formatPlural(forms, 21, "lv")).toBe("21 recepte");
    expect(formatPlural({ one: "{count} x", other: "{count} y" }, 3, "lt")).toBe("3 y");
  });

  it("capitalises Baltic weekday and month names at the start of a date", () => {
    expect(formatDate("2026-11-26", "dayLong", "en")).toBe("Thursday 26 November");
    expect(formatDate("2026-11-26", "dayLong", "et")).toBe("Neljapäev, 26. november");
    expect(formatDate("2026-11-26", "dayLong", "lv")).toBe("Ceturtdiena, 26. novembris");
  });
});
