import { test, expect } from "./test.base";

test.describe("Load extension in chrome", () => {
  test("extension config page opens", async ({ page, baseUrl }) => {
    // Open extension config page
    await page.goto(baseUrl);

    // Test config page loads
    await expect(page.locator("body")).toBeVisible();

    // Test that it has the h1 Houdin title
    const title = await page.locator("h1").innerText();
    expect(title).toBe("Houdin");
  });

  test("extension popup opens", async ({ page, popupUrl }) => {
    // Open extension popup page
    await page.goto(popupUrl);

    // Test popup page loads
    await expect(page.locator("body")).toBeVisible();

    // Test that it has the h1 Houdin title
    const title = await page.locator("h1").innerText();
    expect(title).toBe("Houdin");
  });
});
