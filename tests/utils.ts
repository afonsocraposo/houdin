import { expect, Page } from "@playwright/test";

const DEMO_WORKFLOW = `{
  "connections": [
    {
      "id": "conn-mjibxe",
      "source": "trigger-5rfUmu",
      "sourceHandle": "output",
      "target": "action-P8n5PD",
      "targetHandle": "input"
    }
  ],
  "description": "This is a test workflow",
  "enabled": true,
  "id": "workflow-mo1MFlsIZKh9",
  "lastUpdated": 1758567088230,
  "name": "Test Workflow",
  "nodes": [
    {
      "data": {
        "config": {},
        "type": "page-load"
      },
      "id": "trigger-5rfUmu",
      "inputs": [],
      "outputs": [
        "output"
      ],
      "position": {
        "x": 300,
        "y": 100
      },
      "type": "trigger"
    },
    {
      "data": {
        "config": {
          "modalContent": "Hello from Houdin workflow"
        },
        "type": "show-modal"
      },
      "id": "action-P8n5PD",
      "inputs": [
        "input"
      ],
      "outputs": [
        "output"
      ],
      "position": {
        "x": 600,
        "y": 100
      },
      "type": "action"
    }
  ],
  "urlPattern": "https://*"
}`;

export const importDemoWorkflow = async (
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
