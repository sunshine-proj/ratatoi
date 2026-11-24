import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NavList } from "@/components/layout/nav-list";
import { primaryNav } from "@/lib/navigation";

describe("NavList", () => {
  it("marks only the current page with aria-current", () => {
    render(<nav aria-label="Main"><NavList items={primaryNav} variant="bottom" pathname="/planner" /></nav>);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByRole("link", { name: "Plan" })).toHaveAttribute("aria-current", "page");
    for (const name of ["Today", "Recipes", "Shopping"]) {
      expect(within(nav).getByRole("link", { name })).not.toHaveAttribute("aria-current");
    }
  });

  it("marks a section as current on nested pages", () => {
    render(<NavList items={primaryNav} variant="sidebar" pathname="/recipes/greek-bowl" />);
    expect(screen.getByRole("link", { name: "Recipes" })).toHaveAttribute("aria-current", "page");
  });

  it("renders links without a current page while the path is unknown", () => {
    render(<NavList items={primaryNav} variant="bottom" pathname={null} />);
    expect(screen.getAllByRole("link")).toHaveLength(4);
    for (const link of screen.getAllByRole("link")) expect(link).not.toHaveAttribute("aria-current");
  });
});
