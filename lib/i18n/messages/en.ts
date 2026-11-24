/**
 * English UI strings. This object defines the message shape: every other
 * locale must provide the same keys (enforced by the `Messages` type).
 *
 * Placeholders use `{name}` syntax and are filled with `formatMessage`.
 */
export const en = {
  app: {
    name: "Protein Plate",
    shortName: "Protein Plate",
    description:
      "Plan high-protein meals and snacks, see calories and macros, and build one shopping list.",
    disclaimer: "A meal-planning tool, not medical advice.",
  },
  a11y: {
    skipToContent: "Skip to main content",
    primaryNavigation: "Main",
    settingsNavigation: "Settings",
    notifications: "Notifications",
    home: "Protein Plate home",
  },
  nav: {
    today: "Today",
    plan: "Plan",
    recipes: "Recipes",
    snacks: "Snacks",
    shopping: "Shopping",
    profile: "Profile and goals",
    profileShort: "Profile",
    goals: "Goals",
    preferences: "Preferences",
    account: "Account",
  },
  common: {
    close: "Close",
    dismiss: "Dismiss",
    comingSoon: "This section is on its way.",
  },
  offline: {
    banner: "You're offline. Pages you've opened before still work; others will load when you reconnect.",
  },
  pages: {
    today: {
      title: "Today",
      intro: "Your meals, snacks, and progress towards today's calorie and protein targets will appear here.",
    },
    onboarding: {
      title: "Set up your plan",
      intro: "Choose a goal, set your daily calorie and protein targets, and tell us about foods to avoid.",
    },
    recipes: {
      title: "Recipes",
      intro: "Browse photo-led recipes and filter by meal type, protein, calories, and prep time.",
    },
    recipeDetail: {
      title: "Recipe",
      intro: "Details for “{slug}” — ingredients, steps, and nutrition per serving — will appear here.",
    },
    snacks: {
      title: "Snacks",
      intro: "High-protein snack ideas, with calorie and protein filters you can adjust.",
    },
    planner: {
      title: "Meal plan",
      intro: "Plan breakfast, lunch, dinner, and as many snacks as you like for each day of the week.",
    },
    shoppingList: {
      title: "Shopping list",
      intro: "One combined list of ingredients from your meal plan, grouped by category.",
    },
    goals: {
      title: "Goals",
      intro: "Your daily calorie and protein targets, plus optional carbohydrate and fat targets.",
    },
    preferences: {
      title: "Preferences",
      intro: "Dietary preferences, allergens, and ingredients you'd rather avoid.",
    },
    account: {
      title: "Account and data",
      intro: "Manage what's stored on this device, and export or delete your data.",
    },
    offline: {
      title: "You're offline",
      body: "This page hasn't been saved for offline use yet. Check your connection and try again.",
      retry: "Try again",
    },
    notFound: {
      title: "Page not found",
      body: "We couldn't find that page. It may have moved, or the link may be wrong.",
      home: "Go to Today",
    },
    error: {
      title: "Something went wrong",
      body: "This page couldn't be shown. Trying again often helps.",
      retry: "Try again",
      home: "Go to Today",
    },
    loading: "Loading…",
  },
} as const;

type DeepString<T> = { readonly [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };

export type Messages = DeepString<typeof en>;
