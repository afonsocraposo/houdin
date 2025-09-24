import { BrowserContext, chromium, test as base } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
  baseUrl: string;
}>({
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, "../dist");
    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        process.env.CI ? `--headless=new` : "",
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // for manifest v3:
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent("serviceworker");
    }

    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },
  baseUrl: async ({ context }, use) => {
    // for manifest v3:
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent("serviceworker");
    }

    const extensionId = background.url().split("/")[2];

    const baseUrl = `chrome-extension://${extensionId}/src/config/index.html#/`;
    await use(baseUrl);
  },
});

export const expect = test.expect;
