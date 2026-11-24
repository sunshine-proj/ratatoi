/**
 * English UI strings. This object defines the message shape: every other
 * locale must provide the same keys (enforced by the `Messages` type).
 */
export const en = {
  app: {
    name: "Protein Plate",
    description:
      "Plan high-protein meals and snacks, see calories and macros, and build one shopping list.",
  },
  home: {
    title: "Protein Plate",
    comingSoon: "We're setting things up. Meal planning will be available here soon.",
    disclaimer: "A meal-planning tool, not medical advice.",
  },
} as const;

type DeepString<T> = { readonly [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };

export type Messages = DeepString<typeof en>;
