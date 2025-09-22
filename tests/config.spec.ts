import { test, expect } from "./test.base";

test.describe("Config page", () => {
  // always go to config page before each test
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/src/config/index.html`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("can change tabs in config page", async ({ page }) => {
    // Click on Credentials tab - use getByRole for better semantics
    await page.getByRole("tab", { name: "Credentials" }).click();
    // Check that Credentials tab is active
    await expect(
      page.getByRole("tab", { name: "Credentials" }),
    ).toHaveAttribute("data-active", "true");

    // check if title Workflows h3 is visible
    await expect(
      page.getByRole("heading", { name: "Credentials", level: 3 }),
    ).toBeVisible();

    // Click on History tab - use getByRole to avoid "Clear History" button
    await page.getByRole("tab", { name: "History" }).click();
    // Check that History tab is active
    await expect(page.getByRole("tab", { name: "History" })).toHaveAttribute(
      "data-active",
      "true",
    );

    // Check that History tab has h2 title
    await expect(
      page.getByRole("heading", { name: "Execution history", level: 2 }),
    ).toBeVisible();

    // Click on Workflow tab
    await page.getByRole("tab", { name: "Workflows" }).click();
    // Check that Workflows tab is active
    await expect(page.getByRole("tab", { name: "Workflows" })).toHaveAttribute(
      "data-active",
      "true",
    );

    // Check that Workflows tab has h3 title
    await expect(
      page.getByRole("heading", { name: "Workflows", level: 3 }),
    ).toBeVisible();
  });

  test("can open specific tabs via url param", async ({
    page,
    extensionId,
  }) => {
    // Go to config page with tab param
    await page.goto(
      `chrome-extension://${extensionId}/src/config/index.html#/?tab=history`,
    );
    // Check that History tab is active
    await expect(page.getByRole("tab", { name: "History" })).toHaveAttribute(
      "data-active",
      "true",
    );

    // Check that History tab has h2 title
    await expect(
      page.getByRole("heading", { name: "Execution history", level: 2 }),
    ).toBeVisible();

    // Go to config page with tab param
    await page.goto(
      `chrome-extension://${extensionId}/src/config/index.html#/?tab=credentials`,
    );
    // Check that Credentials tab is active
    await expect(
      page.getByRole("tab", { name: "Credentials" }),
    ).toHaveAttribute("data-active", "true");

    // check if title Workflows h3 is visible
    await expect(
      page.getByRole("heading", { name: "Credentials", level: 3 }),
    ).toBeVisible();

    // Go to config page with tab param
    await page.goto(
      `chrome-extension://${extensionId}/src/config/index.html#/?tab=workflows`,
    );
    // Check that Workflows tab is active
    await expect(page.getByRole("tab", { name: "Workflows" })).toHaveAttribute(
      "data-active",
      "true",
    );

    // Check that Workflows tab has h3 title
    await expect(
      page.getByRole("heading", { name: "Workflows", level: 3 }),
    ).toBeVisible();
  });

  test("default tab is workflows", async ({ page, extensionId }) => {
    // Go to config page without tab param
    await page.goto(`chrome-extension://${extensionId}/src/config/index.html`);
    // Check that Workflows tab is active
    await expect(page.getByRole("tab", { name: "Workflows" })).toHaveAttribute(
      "data-active",
      "true",
    );

    // Check that Workflows tab has h3 title
    await expect(
      page.getByRole("heading", { name: "Workflows", level: 3 }),
    ).toBeVisible();
  });
});
