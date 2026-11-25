import { defineConfig, devices } from "@playwright/test";

// Dedicated port, overridable with E2E_PORT if it is taken on your machine.
const PORT = Number(process.env.E2E_PORT ?? 3210);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  // Mobile-first: a phone viewport alongside desktop, in Chromium, WebKit,
  // and Firefox. Install with: npx playwright install chromium webkit firefox
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    // Other engines: Safari's WebKit (desktop and iPhone) and Firefox.
    { name: "desktop-webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"] } },
    { name: "desktop-firefox", use: { ...devices["Desktop Firefox"] } },
  ],
  // Run against a production build, as recommended by the Next.js testing guide.
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    // Never reuse: if the port is busy, fail loudly instead of testing
    // whatever unrelated app happens to be listening there.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
