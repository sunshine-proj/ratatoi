import { expect, test, type Page } from "@playwright/test";

// PWA checks are browser-level, not layout-level: run them once.
test.skip(({ isMobile }) => isMobile, "PWA checks run in the desktop project only");

type ManifestIcon = { src: string; sizes: string; type: string; purpose?: string };
type Manifest = {
  name: string;
  short_name: string;
  start_url: string;
  display: string;
  theme_color: string;
  background_color: string;
  icons: ManifestIcon[];
};

async function waitForControllingWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }),
      );
    }
  });
}

/** PNG width/height live at fixed offsets in the IHDR chunk. */
function pngSize(buffer: Buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test("manifest is linked and has the fields browsers need to install", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();

  const response = await request.get(href!);
  expect(response.ok()).toBe(true);
  const manifest = (await response.json()) as Manifest;

  expect(manifest.name).toBe("Protein Plate");
  expect(manifest.short_name).toBeTruthy();
  expect(manifest.start_url).toBe("/");
  expect(manifest.display).toBe("standalone");
  expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
  expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);

  const purposes = manifest.icons.map((icon) => `${icon.sizes}:${icon.purpose ?? "any"}`);
  expect(purposes).toEqual(expect.arrayContaining(["192x192:any", "512x512:any", "512x512:maskable"]));

  for (const icon of manifest.icons) {
    const image = await request.get(icon.src);
    expect(image.ok(), icon.src).toBe(true);
    expect(image.headers()["content-type"]).toContain("image/png");
    const { width, height } = pngSize(await image.body());
    expect(`${width}x${height}`, icon.src).toBe(icon.sizes);
  }
});

test("page head has theme colour, apple touch icon, and favicon", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#fbf7f0");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", /icon/);
});

test("service worker registers and controls the page", async ({ page }) => {
  await page.goto("/");
  await waitForControllingWorker(page);
  const scriptURL = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL);
  // The worker URL carries the language whose core pages it precaches.
  expect(scriptURL).toMatch(/\/sw\.js\?locale=en$/);
});

test("each language has its own manifest, so the installed app opens in that language", async ({ page, request }) => {
  await page.goto("/lt");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBe("/lt/manifest.webmanifest");
  const manifest = (await (await request.get(href!)).json()) as Manifest & { lang: string };
  expect(manifest.start_url).toBe("/lt");
  expect(manifest.lang).toBe("lt");
  await waitForControllingWorker(page);
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toMatch(/\/sw\.js\?locale=lt$/);
});

test("sw.js is served uncached so updates roll out", async ({ request }) => {
  const response = await request.get("/sw.js");
  expect(response.ok()).toBe(true);
  expect(response.headers()["cache-control"]).toContain("no-cache");
  expect(response.headers()["content-type"]).toContain("javascript");
});

test("Chrome reports no installability errors", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Uses the Chrome DevTools Protocol");
  await page.goto("/");
  await waitForControllingWorker(page);
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = (await cdp.send("Page.getInstallabilityErrors")) as {
    installabilityErrors: Array<{ errorId: string }>;
  };
  expect(installabilityErrors.map((error) => error.errorId)).toEqual([]);
});

test.describe("offline", () => {
  test("a visited page reloads offline from the app-shell cache, with an offline notice", async ({ page, context }) => {
    await page.goto("/");
    await waitForControllingWorker(page);
    // Let the worker finish caching the assets the page sent it.
    await page.waitForTimeout(500);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Today");
    await expect(page.getByText("You're offline.")).toBeVisible();

    await context.setOffline(false);
    await expect(page.getByText("You're offline.")).toBeHidden();
  });

  test("an unvisited page falls back to the offline page", async ({ page, context, browserName }) => {
    // Firefox's offline emulation doesn't cover requests made by the service
    // worker itself, so the worker can still reach the network there.
    test.skip(browserName === "firefox", "Offline emulation doesn't apply to service-worker fetches in Firefox");
    await page.goto("/");
    await waitForControllingWorker(page);
    await page.waitForTimeout(500);

    await context.setOffline(true);
    // Core pages are precached; an unvisited recipe page is not.
    await page.goto("/recipes/berry-whey-smoothie");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("You're offline");
    await context.setOffline(false);
  });

  test("core pages of the chosen language open offline, never visited", async ({ page, context, browserName }) => {
    test.skip(browserName === "firefox", "Offline emulation doesn't apply to service-worker fetches in Firefox");
    await page.goto("/et");
    await waitForControllingWorker(page);
    // The Estonian worker may still be installing behind an earlier one; wait for it.
    await expect
      .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? ""), { timeout: 15_000 })
      .toMatch(/locale=et$/);
    await page.waitForTimeout(500);

    await context.setOffline(true);
    await page.goto("/et/shopping-list");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ostunimekiri");
    await page.goto("/et/recipes/berry-whey-smoothie");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Oled võrguühenduseta");
    await context.setOffline(false);
  });
});
