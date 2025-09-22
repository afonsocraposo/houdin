import { test, expect } from "./test.base";

test.describe("Load extension in chrome", () => {
  test("content script injection", async ({ page }) => {
    await page.goto("https://example.com");

    // Wait for content script to initialize
    await page.waitForTimeout(1000);

    // Test if Houdin extension has been initialized
    const hasHoudinExtension = await page.evaluate(() => {
      // search for element #mantine-injector-root
      return !!document.querySelector("#mantine-injector-root");
    });

    expect(hasHoudinExtension).toBeTruthy();
  });

  test("extension config page opens", async ({ page, extensionId }) => {
    // Open extension config page
    await page.goto(`chrome-extension://${extensionId}/src/config/index.html`);

    // Test config page loads
    await expect(page.locator("body")).toBeVisible();

    // Test that it has the h1 Houdin title
    const title = await page.locator("h1").innerText();
    expect(title).toBe("Houdin");
  });

  test("extension popup opens", async ({ page, extensionId }) => {
    // Open extension popup page
    await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);

    // Test popup page loads
    await expect(page.locator("body")).toBeVisible();

    // Test that it has the h1 Houdin title
    const title = await page.locator("h1").innerText();
    expect(title).toBe("Houdin");
  });
});
