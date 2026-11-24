import { describe, expect, it } from "vitest";
import { isActivePath, primaryNav, profileNavItem, routes, sidebarNav } from "@/lib/navigation";

describe("isActivePath", () => {
  it("matches Today only on the exact root path", () => {
    expect(isActivePath("/", { href: "/" })).toBe(true);
    expect(isActivePath("/recipes", { href: "/" })).toBe(false);
  });

  it("matches a section and its nested pages, but not lookalike prefixes", () => {
    const recipes = { href: "/recipes" };
    expect(isActivePath("/recipes", recipes)).toBe(true);
    expect(isActivePath("/recipes/greek-bowl", recipes)).toBe(true);
    expect(isActivePath("/recipes-archive", recipes)).toBe(false);
  });

  it("honours extra match prefixes (profile covers all settings)", () => {
    expect(isActivePath("/settings/preferences", profileNavItem)).toBe(true);
    expect(isActivePath("/settings/account", profileNavItem)).toBe(true);
  });
});

describe("navigation config", () => {
  it("bottom bar has the four PRD destinations in order", () => {
    expect(primaryNav.map((item) => item.href)).toEqual([
      routes.today,
      routes.planner,
      routes.recipes,
      routes.shoppingList,
    ]);
  });

  it("sidebar includes every primary destination plus Snacks", () => {
    const hrefs = sidebarNav.map((item) => item.href);
    for (const item of primaryNav) expect(hrefs).toContain(item.href);
    expect(hrefs).toContain(routes.snacks);
  });

  it("encodes recipe slugs in URLs", () => {
    expect(routes.recipe("greek-bowl")).toBe("/recipes/greek-bowl");
    expect(routes.recipe("a b")).toBe("/recipes/a%20b");
  });
});
