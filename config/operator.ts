/**
 * Who runs Protein Plate, shown in the privacy notice ("Who runs Protein
 * Plate"). Required before a public launch: `npm run launch:check` fails
 * while this is null.
 *
 * Fill in real details only. Example shape:
 *   export const operator: Operator | null = {
 *     name: "Example Ltd",           // person or company responsible for the app
 *     country: "Lithuania",
 *     email: "privacy@example.com",  // contact for privacy questions
 *   };
 *
 * Kept free of path aliases so scripts/launch-check.ts can import it directly.
 */
export type Operator = { name: string; country: string; email: string };

export const operator: Operator | null = null;
