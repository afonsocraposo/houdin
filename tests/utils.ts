import { expect, Page } from "@playwright/test";
import { DEMO_WORKFLOW } from "./demoWorkflows/index";

export const importWorkflow = async (
  baseUrl: string,
  page: Page,
  workflowJson: Record<string, any> = DEMO_WORKFLOW,
) => {
  await page.goto(UrlBuilder(baseUrl, Destinations.WORKFLOWS));
  // click on Import Workflow button, id="open-import-workflow-modal"
  await page.locator("#open-import-workflow-modal").click();

  // Expect to see text "Import Workflow" in modal
  await expect(page.getByText("Or paste JSON content")).toBeVisible();

  // Paste the workflow JSON in the textArea, placeholder="Paste your workflow JSON here..."
  await page
    .locator('textarea[placeholder="Paste your workflow JSON here..."]')
    .fill(JSON.stringify(workflowJson));

  // Click on Import button element
  await page.locator("#confirm-import-workflow").click();
};

export enum Destinations {
  WORKFLOWS = "?tab=workflows",
  HISTORY = "?tab=history",
  CREDENTIALS = "?tab=credentials",
}

export const UrlBuilder = (baseUrl: string, path: Destinations) => {
  return `${baseUrl}${path}`;
};
