import { describe, expect, it } from "vitest";
import { defaultLocale, getMessages, isLocale, locales } from "@/lib/i18n";

function collectStrings(value: unknown, path = ""): Array<[string, unknown]> {
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      collectStrings(child, path ? `${path}.${key}` : key),
    );
  }
  return [[path, value]];
}

describe("i18n", () => {
  it("defaults to English", () => {
    expect(defaultLocale).toBe("en");
    expect(getMessages()).toBe(getMessages("en"));
  });

  it("recognises only supported locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("xx")).toBe(false);
  });

  it.each(locales)("%s has a non-empty string for every key", (locale) => {
    for (const [key, value] of collectStrings(getMessages(locale))) {
      expect(typeof value, key).toBe("string");
      expect((value as string).trim(), key).not.toBe("");
    }
  });
});
