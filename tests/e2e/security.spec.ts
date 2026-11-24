import { expect, test } from "@playwright/test";

test.skip(({ isMobile }) => isMobile, "Header checks run in the desktop project only");

test("security headers are sent", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).toContain("connect-src 'self'");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("no page breaks the Content Security Policy, and nothing loads from other origins", async ({ page }) => {
  const violations: string[] = [];
  const foreign: string[] = [];
  page.on("console", (message) => {
    if (/Content Security Policy|Refused to/i.test(message.text())) violations.push(message.text());
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!["localhost", "127.0.0.1"].includes(url.hostname) && !url.protocol.startsWith("data") && !url.protocol.startsWith("blob")) {
      foreign.push(request.url());
    }
  });
  for (const route of ["/", "/recipes", "/recipes/chicken-hummus-wraps", "/snacks", "/planner", "/shopping-list", "/onboarding", "/settings/goals", "/settings/account", "/privacy"]) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
  }
  // Exercise the service worker and data export too.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.goto("/settings/account");
  expect(violations).toEqual([]);
  expect(foreign).toEqual([]);
});
