import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Reads colour tokens straight from app/globals.css so the CSS stays the
 * single source of truth, then checks WCAG 2.2 contrast for every pair the
 * UI relies on. Text needs 4.5:1; control borders and focus rings need 3:1.
 */
const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  if (!match?.[1]) throw new Error(`Colour token --color-${name} not found as a hex value`);
  return match[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT = 4.5;
const NON_TEXT = 3;

const pairs: Array<[fg: string, bg: string, min: number]> = [
  ["ink", "canvas", TEXT],
  ["ink", "surface", TEXT],
  ["ink", "surface-muted", TEXT],
  ["ink-muted", "canvas", TEXT],
  ["ink-muted", "surface", TEXT],
  ["ink-muted", "surface-muted", TEXT],
  ["primary", "canvas", TEXT],
  ["primary", "surface", TEXT],
  ["primary", "surface-muted", TEXT],
  ["on-primary", "primary", TEXT],
  ["on-primary", "primary-hover", TEXT],
  ["primary-strong", "primary-soft", TEXT],
  ["on-accent", "accent", TEXT],
  ["accent", "surface", TEXT],
  ["accent-strong", "accent-soft", TEXT],
  ["danger", "surface", TEXT],
  ["danger", "canvas", TEXT],
  ["danger", "danger-soft", TEXT],
  ["on-danger", "danger", TEXT],
  ["line-strong", "surface", NON_TEXT],
  ["line-strong", "canvas", NON_TEXT],
  ["focus", "canvas", NON_TEXT],
  ["focus", "surface", NON_TEXT],
  ["primary", "surface", NON_TEXT],
];

describe("design token contrast (WCAG 2.2 AA)", () => {
  it.each(pairs)("%s on %s ≥ %d:1", (fg, bg, min) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(min);
  });

  it("computes known reference ratios", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });
});
