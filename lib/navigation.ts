import type { Messages } from "@/lib/i18n";

/** Every route in the app, in one place, so links never drift. */
export const routes = {
  today: "/",
  onboarding: "/onboarding",
  recipes: "/recipes",
  recipe: (slug: string) => `/recipes/${encodeURIComponent(slug)}`,
  snacks: "/snacks",
  planner: "/planner",
  shoppingList: "/shopping-list",
  goals: "/settings/goals",
  preferences: "/settings/preferences",
  account: "/settings/account",
  offline: "/offline",
} as const;

export type NavIcon = "today" | "plan" | "recipes" | "snacks" | "shopping" | "profile";

export type NavItem = {
  href: string;
  label: keyof Messages["nav"];
  icon: NavIcon;
  /** Extra path prefixes that should also mark this item as current. */
  matches?: readonly string[];
};

/** Mobile bottom bar: the four primary destinations from the PRD. */
export const primaryNav: readonly NavItem[] = [
  { href: routes.today, label: "today", icon: "today" },
  { href: routes.planner, label: "plan", icon: "plan" },
  { href: routes.recipes, label: "recipes", icon: "recipes" },
  { href: routes.shoppingList, label: "shopping", icon: "shopping" },
];

/** Desktop sidebar: primary destinations plus Snacks and Profile. */
export const sidebarNav: readonly NavItem[] = [
  ...primaryNav.slice(0, 3),
  { href: routes.snacks, label: "snacks", icon: "snacks" },
  primaryNav[3]!,
];

export const profileNavItem: NavItem = {
  href: routes.goals,
  label: "profile",
  icon: "profile",
  matches: ["/settings"],
};

export const settingsNav: readonly NavItem[] = [
  { href: routes.goals, label: "goals", icon: "profile" },
  { href: routes.preferences, label: "preferences", icon: "profile" },
  { href: routes.account, label: "account", icon: "profile" },
];

/**
 * Whether a nav item represents the current page. Today ("/") only matches
 * exactly; other items match their own path and anything beneath it.
 */
export function isActivePath(pathname: string, item: Pick<NavItem, "href" | "matches">): boolean {
  const prefixes = [item.href, ...(item.matches ?? [])];
  return prefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
