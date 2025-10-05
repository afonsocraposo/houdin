import { DEMO_FAILING_WORKFLOW as DEMO_FAILING_WORKFLOW } from "./demoWorkflows";
import { test, expect } from "./test.base";
import { Destinations, importWorkflow, UrlBuilder } from "./utils";

test.describe("Execution history", () => {
  // always go to config page before each test
  test.beforeEach(async ({ page, baseUrl }) => {
    await page.goto(UrlBuilder(baseUrl, Destinations.HISTORY));
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

  test("different ways to go to executions", async ({
    page,
    baseUrl,
    popupUrl,
  }) => {
    // import demo workflow
    await importWorkflow(baseUrl, page);

    // Click on button "View execution history"
    await page.getByRole("button", { name: "View execution history" }).click();

    // Check that URL has changed to history tab
    await expect(page).toHaveURL(/tab=history/);
    // Check that URL has parameter workflow=workflow-
    await expect(page).toHaveURL(/workflow=workflow-/);

    // Expect input with placeholder "Filter by workflow" to have value "Test Workflow"
    await expect(
      page.locator('input[placeholder="Filter by workflow"]'),
    ).toHaveValue("Test Workflow");

    // Go back to workflows tabs
    await page.goto(UrlBuilder(baseUrl, Destinations.WORKFLOWS));

    // Click on edit workflow
    await page.locator('button[title="Edit workflow"]').click();

    // Get workflow id from URL
    const workflowId = page.url().split("/designer/")[1];

    // Click on View History button
    await page.getByRole("button", { name: "View History" }).click();

    // Check that URL has changed to history tab
    await expect(page).toHaveURL(/tab=history/);

    // Check that URL has parameter workflow={workflowId}
    await expect(page).toHaveURL(new RegExp(`workflow=${workflowId}`));

    // Open popup
    await page.goto(popupUrl);

    // Click on History tab
    await page.getByRole("tab", { name: "History" }).click();

    // Click on button "View Full History" that will open a new tab
    const [newPage] = await Promise.all([
      page.context().waitForEvent("page"),
      page.getByRole("button", { name: "View Full History" }).click(),
    ]);

    // Check that URL has changed to baseUrl with history tab
    await expect(newPage).toHaveURL(UrlBuilder(baseUrl, Destinations.HISTORY));
  });

  test("see execution history after running workflow", async ({
    page,
    context,
    baseUrl,
    popupUrl,
  }) => {
    // import demo workflow
    await importWorkflow(baseUrl, page);

    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Go to example.com to trigger the workflow
    await page.goto("https://example.com");

    // Wait to allow the workflow to execute
    await page.waitForTimeout(1000);

    // Wait for text to show in modal
    await expect(page.getByText("Hello from Houdin workflow")).toBeVisible();

    // Go back to history page
    page.goto(UrlBuilder(baseUrl, Destinations.HISTORY));

    // Select option in select with placeholder o|filter by workflow"
    await page.locator('input[placeholder="Filter by workflow"]').click();

    // Select the option "Test Workflow" in the dropdown
    await page.getByRole("option", { name: "Test Workflow" }).click();

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

    // Hover the element .mantine-CodeHighlight-codeHighlight
    await page.locator(".mantine-CodeHighlight-codeHighlight").first().hover();
    // Click on copy button
    await page.getByLabel("Copy code").first().click();

    // Check clipboard content
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`{
  "url": "https://example.com/"
}`);

    // Close the output modal
    await viewOutput.nth(0).click();

    // Open the second node output
    await viewOutput.nth(1).click();
    // Hover the element .mantine-CodeHighlight-codeHighlight
    await page.locator(".mantine-CodeHighlight-codeHighlight").last().hover();
    // Click on copy button
    await page.getByLabel("Copy code").last().click();

    // Check clipboard content
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`{
  "content": "Hello from Houdin workflow",
  "title": "Workflow Result"
}`);

    // Check that popup shows history as well
    await page.goto(popupUrl);
    await page.getByRole("tab", { name: "History" }).click();

    // check for text "1 executed"
    await expect(page.getByText("1 executed")).toBeVisible();

    // check for text "1 completed"
    await expect(page.getByText("1 completed")).toBeVisible();

    // check for text "Test Workflow"
    await expect(page.getByText("Test Workflow")).toBeVisible();
  });

  test("see execution history with failing workflow", async ({
    page,
    baseUrl,
    context,
    popupUrl,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // import demo failing workflow
    await importWorkflow(baseUrl, page, DEMO_FAILING_WORKFLOW);

    // Go to example.com to trigger the workflow
    await page.goto("https://example.com");

    // Wait to allow the workflow to execute
    await page.waitForTimeout(1000);

    // Go back to history page
    page.goto(UrlBuilder(baseUrl, Destinations.HISTORY));

    // Select option in select with placeholder Filter by status
    await page.locator('input[placeholder="Filter by status"]').click();
    // Select option Completed
    await page.getByRole("option", { name: "Completed" }).click();

    // Check that empty state is visible
    await expect(
      page.getByText("No executions match your filters"),
    ).toBeVisible();

    // Select Failed option
    await page.locator('input[placeholder="Filter by status"]').click();
    await page.getByRole("option", { name: "Failed" }).click();

    // Check that execution is visible in history, search for text "exec-"
    await expect(page.getByText(/exec-/)).toBeVisible();

    // Check for workflow name "Test Workflow", get the visible one in case there are multiple
    await expect(page.locator('text="Test Workflow"').last()).toBeVisible();

    // Check for trigger type "page-load"
    await expect(page.getByText("page-load")).toBeVisible();

    // Check for example.com
    await expect(page.getByText("https://example.com/")).toBeVisible();

    // Check for status "Completed"
    await expect(page.getByText("failed", { exact: true })).toBeVisible();

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
    await expect(page.getByText("action:click-element")).toBeVisible();

    // Expect to see one Success and one Error badge
    await expect(page.getByText("success")).toHaveCount(1);
    await expect(page.getByText("error")).toHaveCount(1);

    // Click on "View Output" elements
    const viewOutput = page.locator('text="View Output"');

    await viewOutput.first().click();

    // Hover the element .mantine-CodeHighlight-codeHighlight
    await page.locator(".mantine-CodeHighlight-codeHighlight").first().hover();
    // Click on copy button
    await page.getByLabel("Copy code").first().click();

    // Check clipboard content
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`{
  "url": "https://example.com/"
}`);

    // Hover the element .mantine-CodeHighlight-codeHighlight
    await page.locator(".mantine-CodeHighlight-codeHighlight").last().hover();
    // Click on copy button
    await page.getByLabel("Copy code").last().click();

    // Check clipboard content
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "Element not found for selector: #non-existent-element",
    );
    //
    // Check that popup shows history as well
    await page.goto(popupUrl);
    await page.getByRole("tab", { name: "History" }).click();

    // check for text "1 executed"
    await expect(page.getByText("1 executed")).toBeVisible();

    await expect(page.getByText("1 failed")).toBeVisible();

    // check for text "Test Workflow"
    await expect(page.getByText("Test Workflow")).toBeVisible();
  });
});
