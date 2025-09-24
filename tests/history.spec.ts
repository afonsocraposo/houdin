import { test, expect } from "./test.base";
import { importDemoWorkflow } from "./utils";

test.describe("Execution history", () => {
  // always go to config page before each test
  test.beforeEach(async ({ page, extensionId }) => {
    // import demo workflow
    await importDemoWorkflow(extensionId, page);

    await page.goto(
      `chrome-extension://${extensionId}/src/config/index.html#/?tab=history`,
    );
    await expect(page.locator("body")).toBeVisible();
    // Check that Workflows tab has h3 title
    await expect(
      page.getByRole("heading", { name: "Execution history", level: 2 }),
    ).toBeVisible();
  });

  test("show empty state when no executions", async ({ page }) => {
    // Check that empty state is visible
    await expect(page.getByText("No executions yet")).toBeVisible();
  });

  test("see execution history after running workflow", async ({
    page,
    extensionId,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Go to example.com to trigger the workflow
    await page.goto("https://example.com");

    // Wait to allow the workflow to execute
    await page.waitForTimeout(1000);

    // Wait for text to show in modal
    await expect(page.getByText("Hello from Houdin workflow")).toBeVisible();

    // Go back to history page
    page.goto(
      `chrome-extension://${extensionId}/src/config/index.html#/?tab=history`,
    );

    // Check that execution is visible in history, search for text "exec-"
    await expect(page.getByText(/exec-/)).toBeVisible();

    // Check for workflow name "Test Workflow", get the visible one in case there are multiple
    await expect(page.locator('text="Test Workflow"').last()).toBeVisible();

    // Check for trigger type "page-load"
    await expect(page.getByText("page-load")).toBeVisible();

    // Check for example.com
    await expect(page.getByText("https://example.com/")).toBeVisible();

    // Check for status "Completed"
    await expect(page.getByText("completed", { exact: true })).toBeVisible();

    // Get first row of history table
    const firstRow = page.locator("table tbody tr").first();

    // Click on first row button to expand details
    await firstRow.getByRole("button").click();

    // Search for trigger-5rfUmu in details
    await expect(page.getByText("trigger-5rfUmu")).toBeVisible();
    // Search for action-P8n5PD in details
    await expect(page.getByText("action-P8n5PD")).toBeVisible();

    // Search for node type
    await expect(page.getByText("trigger:page-load")).toBeVisible();
    await expect(page.getByText("action:show-modal")).toBeVisible();

    // Click on "View Output" elements
    const viewOutput = page.locator('text="View Output"');
    await viewOutput.nth(0).click();

    // Click on copy button, label="Copy code"
    await page.getByLabel("Copy code").first().click();

    // Check clipboard content
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`{
  "url": "https://example.com/"
}`);

    // Close the output modal
    await viewOutput.nth(0).click();

    // Open the second node output
    await viewOutput.nth(1).click();
    // Click on copy button
    await page.getByLabel("Copy code").last().click();

    // Check clipboard content
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`{
  "content": "Hello from Houdin workflow",
  "title": "Workflow Result"
}`);
  });
});
