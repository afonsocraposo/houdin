import { expect, Page } from "@playwright/test";
import { DEMO_WORKFLOW } from "./demoWorkflows";

export const importWorkflow = async (
  extensionId: string,
  page: Page,
  workflowJson: string = DEMO_WORKFLOW,
) => {
  await page.goto(
    `chrome-extension://${extensionId}/src/config/index.html#/?tab=workflows`,
  );
  // click on Import Workflow button, id="open-import-workflow-modal"
  await page.locator("#open-import-workflow-modal").click();

  // Expect to see text "Import Workflow" in modal
  await expect(page.getByText("Or paste JSON content")).toBeVisible();

  // Paste the workflow JSON in the textArea, placeholder="Paste your workflow JSON here..."
  await page
    .locator('textarea[placeholder="Paste your workflow JSON here..."]')
    .fill(workflowJson);

  // Click on Import button element
  await page.locator("#confirm-import-workflow").click();
};
