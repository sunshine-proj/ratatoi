import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Latvian, Lithuanian, and Estonian: routing, language choice, translated
 * content, and the main flows working in another language.
 */

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-26T10:00:00"));
});

const home = [
  { locale: "lv", path: "/lv", heading: "Šodien", nav: "Receptes" },
  { locale: "lt", path: "/lt", heading: "Šiandien", nav: "Receptai" },
  { locale: "et", path: "/et", heading: "Täna", nav: "Retseptid" },
] as const;

for (const { locale, path, heading, nav } of home) {
  test(`${path} is in its language, with lang="${locale}" and translated navigation`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await page.getByRole("navigation").getByRole("link", { name: nav }).first().click();
    await expect(page).toHaveURL(`${path}/recipes`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
  });
}

test("English keeps its unprefixed addresses, and /en redirects to them", async ({ page }) => {
  await page.goto("/en/recipes");
  await expect(page).toHaveURL("/recipes");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("unknown pages are real 404s in each language", async ({ page }) => {
  const response = await page.goto("/lt/nera-tokio-puslapio");
  expect(response?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "lt");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Puslapis nerastas");

  const recipe = await page.goto("/et/recipes/does-not-exist");
  expect(recipe?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lehte ei leitud");
});

test("the language picker keeps you on the same page and remembers the choice", async ({ page, context }) => {
  await page.goto("/recipes/lemon-salmon-traybake");
  const picker = page.getByRole("navigation", { name: "Language" });
  await expect(picker.getByRole("link", { name: "English" })).toHaveAttribute("aria-current", "true");
  await expect(picker.getByRole("link", { name: "Latviešu" })).toHaveAttribute("lang", "lv");

  await picker.getByRole("link", { name: "Latviešu" }).click();
  await expect(page).toHaveURL("/lv/recipes/lemon-salmon-traybake");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cepeškrāsnī cepts citronu lasis ar kartupeļiem");

  const cookie = (await context.cookies()).find((c) => c.name === "pp-locale");
  expect(cookie?.value).toBe("lv");
  // Opening the bare address now goes to Latvian.
  await page.goto("/planner");
  await expect(page).toHaveURL("/lv/planner");

  // Choosing English again sticks, too.
  await page.getByRole("navigation", { name: "Valoda" }).getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL("/planner");
  await page.goto("/");
  await expect(page).toHaveURL("/");
});

test.describe("first visit with a Lithuanian browser", () => {
  test.use({ locale: "lt-LT" });

  test("opens in Lithuanian, unless English was chosen", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/lt");
    await expect(page.locator("html")).toHaveAttribute("lang", "lt");

    await page.getByRole("navigation", { name: "Kalba" }).getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL("/");
    await page.goto("/recipes");
    await expect(page).toHaveURL("/recipes");
  });
});

test("Settings → Preferences has the language picker", async ({ page }) => {
  await page.goto("/et/settings/preferences");
  const section = page.getByRole("region", { name: "Keel" });
  await expect(section.getByRole("link", { name: "Lietuvių" })).toHaveAttribute("href", "/lt/settings/preferences");
});

test("a recipe page shows translated text, units, and number formats", async ({ page }) => {
  await page.goto("/lt/recipes/turkey-black-bean-chilli");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kalakutienos ir juodųjų pupelių čili");
  const ingredients = page.getByRole("region", { name: "Ingredientai" });
  await expect(ingredients.getByText("4 porcijoms")).toBeVisible();
  await expect(ingredients.getByRole("listitem").filter({ hasText: "Česnakai" })).toContainText("skiltelės");
  await expect(page.getByRole("region", { name: "Alergenai" })).toContainText("Remiamasi įprastomis");
  await expect(page.getByText("Apytikslė", { exact: true })).toBeVisible();
});

test("search finds recipes by ingredient names in the language", async ({ page }) => {
  await page.goto("/lv/recipes");
  await page.getByRole("searchbox", { name: "Meklēt receptes" }).fill("lasis");
  await expect(page.getByRole("link", { name: "Cepeškrāsnī cepts citronu lasis ar kartupeļiem" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "recept" }).first()).toContainText(/2 receptes|1 recepte/);
});

test("plan a meal and build a shopping list in Estonian", async ({ page }) => {
  await page.goto("/et/planner");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Toiduplaan");
  await page.getByRole("button", { name: "Lisa lõunasöök" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Lisa: Tuunikala-kikerhernesalat" }).click();
  await expect(page.getByText(/Lisatud: Tuunikala-kikerhernesalat/)).toBeVisible();

  await page.goto("/et/shopping-list");
  await page.getByRole("button", { name: "Koosta nimekiri plaani põhjal" }).click();
  await expect(page.getByRole("checkbox", { name: /Kikerherned/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Puu- ja köögiviljad" })).toBeVisible();

  // Switch language: the same list, now in Lithuanian.
  await page.getByRole("navigation", { name: "Keel" }).getByRole("link", { name: "Lietuvių" }).click();
  await expect(page).toHaveURL("/lt/shopping-list");
  await expect(page.getByRole("checkbox", { name: /Avinžirniai/ })).toBeVisible();
});

test("decimal commas work in Lithuanian forms", async ({ page }) => {
  await page.goto("/lt/shopping-list");
  await page.getByRole("textbox", { name: "Produktas" }).fill("Kava");
  await page.getByRole("textbox", { name: "Kiekis" }).fill("0,5");
  await page.getByRole("combobox", { name: "Vienetas" }).selectOption("kg");
  await page.getByRole("button", { name: "Pridėti produktą" }).click();
  await expect(page.getByRole("checkbox", { name: "0,5 kg Kava" })).toBeVisible();
});

for (const path of ["/lv", "/lt/recipes/berry-yoghurt-power-bowl", "/et/planner", "/lt/settings/preferences", "/lv/privacy"]) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}
