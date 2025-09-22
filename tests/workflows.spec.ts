import { test, expect } from "./test.base";

test.describe("Workflows creation and design", () => {
  // always go to config page before each test
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(
      `chrome-extension://${extensionId}/src/config/index.html#/?tab=workflows`,
    );
    await expect(page.locator("body")).toBeVisible();
    // Check that Workflows tab has h3 title
    await expect(
      page.getByRole("heading", { name: "Workflows", level: 3 }),
    ).toBeVisible();
  });

  test("can create a workflow and see it in the dashboard", async ({
    page,
  }) => {
    // expect to see no workflows message
    await expect(page.getByText("No workflows created yet.")).toBeVisible();

    // Click on Create workflow button
    await page.getByRole("button", { name: "Create Workflow" }).click();

    // Check that URL has changed to #/designer
    await expect(page).toHaveURL(/#\/designer/);

    // Expect to see workflow designer
    await expect(
      page.getByRole("heading", { name: "Create New Workflow", level: 2 }),
    ).toBeVisible();

    // Fill in workflow name
    await page.getByLabel("Workflow Name").fill("Test Workflow");

    // Click on add node button, #add-node-button
    await page.locator("#add-node-button").click();

    // Expect to see text "Add Node" in drawer
    await expect(page.getByText("Add Node")).toBeVisible();

    // Click on "Page Load" item
    await page.getByText("Page Load").click();

    // Expect to see node properties drawer with description of Page Load
    await expect(
      page.getByText("Trigger when page finishes loading"),
    ).toBeVisible();

    // Expect to see React Flow Node, class .react-flow__node, with text "Page Load"
    await expect(
      page.locator(".react-flow__node").filter({ hasText: "Page Load" }),
    ).toBeVisible();
  });
});
