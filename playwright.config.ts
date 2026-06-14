import { defineConfig, devices } from "@playwright/test";

// E2E against the already-running dev server on :3030 (uses system Chrome, no browser download).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3030",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        launchOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
      },
    },
  ],
});
