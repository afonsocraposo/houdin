import { expect, Page } from "@playwright/test";
import type { WorkflowExecution, WorkflowDefinition } from "../src/types/workflow";
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

function createPersistedState(
  workflows: WorkflowDefinition[],
  executions: WorkflowExecution[],
) {
  return {
    state: {
      workflows,
      lastServerTime: 0,
      pendingUpdates: [],
      pendingDeletes: {},
      executions,
      executionStats: {
        total: executions.length,
        successful: executions.filter((execution) => execution.status === "completed")
          .length,
        failed: executions.filter((execution) => execution.status === "failed").length,
      },
      syncStartedAt: undefined,
      syncCompletedAt: undefined,
      syncResult: null,
      settings: {
        sync: { enabled: true },
        workfowGeneration: {
          provider: "houdin",
          model: "",
          providerUrl: "",
          credentialId: null,
          expandTools: false,
        },
        general: { analytics: true },
      },
      popupSessionId: null,
      sessions: {},
    },
    version: 0,
  };
}

export const seedStore = async (
  baseUrl: string,
  page: Page,
  {
    workflows = [],
    executions = [],
  }: {
    workflows?: WorkflowDefinition[];
    executions?: WorkflowExecution[];
  },
) => {
  await page.goto(UrlBuilder(baseUrl, Destinations.WORKFLOWS));

  const storeValue = JSON.stringify(createPersistedState(workflows, executions));
  await page.evaluate(async ({ value }) => {
    localStorage.setItem("urlAlertDismissed", "true");

    await new Promise<void>((resolve, reject) => {
      chrome.storage.local.set({ "houdin-store": value }, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }

        resolve();
      });
    });
  }, { value: storeValue });

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Workflows", level: 3 }),
  ).toBeVisible();
};

export const seedWorkflows = async (
  baseUrl: string,
  page: Page,
  workflows: WorkflowDefinition[] = [DEMO_WORKFLOW as WorkflowDefinition],
) => {
  await seedStore(baseUrl, page, { workflows });
};

export enum Destinations {
  WORKFLOWS = "?tab=workflows",
  HISTORY = "?tab=history",
  CREDENTIALS = "?tab=credentials",
}

export const UrlBuilder = (baseUrl: string, path: Destinations) => {
  return `${baseUrl}${path}`;
};
