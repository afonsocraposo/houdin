import { PlaywrightTestConfig, devices } from "@playwright/test";

export const timeouts = {
  actionTimeout: 15_000,
  testTimeout: 60_000,
};

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: "./tests",
  testMatch: /(.+\.)?(test|spec|e2e)\.[jt]s/,
  /* Maximum time one test can run for. */
  timeout: timeouts.testTimeout,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: timeouts.actionTimeout,
  },
  /* Number of workers to run tests on. */
  workers: process.env.CI ? 2 : 1,
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html", { open: "never" }],
    process.env.CI ? ["github", "junit"] : ["line"],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: timeouts.actionTimeout,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-failure",
  },

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: "playwright-output/",

  /* Extensions only work in Chrome / Chromium. */
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },
  ],
};

export default config;
