import { test, expect } from "./test.base";
import {
  ActionNodeData,
  TriggerNodeData,
  WorkflowDefinition,
} from "../src/types/workflow";
import { Destinations, importWorkflow, urlBuilder } from "./utils";

test.describe("Workflows creation, design and execution", () => {
  // always go to config page before each test
  test.beforeEach(async ({ page, baseUrl }) => {
    await page.goto(urlBuilder(baseUrl, Destinations.WORKFLOWS));
    await expect(page.locator("body")).toBeVisible();
    // Check that Workflows tab has h3 title
    await expect(
      page.getByRole("heading", { name: "Workflows", level: 3 }),
    ).toBeVisible();
  });

  test("can create a simple workflow and see it in the dashboard", async ({
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

    // Fill in workflow description
    await page
      .getByLabel("Description (Optional)")
      .fill("This is a test workflow");

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

    // Close drawer, button aria-label="Close node properties"
    await page.getByRole("button", { name: "Close node properties" }).click();
    await expect(
      page.getByText("Trigger when page finishes loading"),
    ).not.toBeVisible();

    // Click on add node button, #add-node-button
    await page.locator("#add-node-button").click();
    // Click on "Show Modal" item
    await page.getByText("Show Modal").click();

    // Expect to see node properties drawer with description of Show Modal
    await expect(page.getByText("Display modal with content")).toBeVisible();

    // Write "Hello from Houdin workflow" in the Modal Content field
    await page.getByLabel("Modal Content").fill("Hello from Houdin workflow");

    // Close drawer, button aria-label="Close node properties"
    await page.getByRole("button", { name: "Close node properties" }).click();

    // Get trigger id
    const triggerId = await page
      .locator(".react-flow__node")
      .filter({ hasText: "Page Load" })
      .getAttribute("data-id");

    // Get action id
    const actionId = await page
      .locator(".react-flow__node")
      .filter({ hasText: "Show Modal" })
      .getAttribute("data-id");

    // Connect the two nodes
    if (!triggerId || !actionId) {
      throw new Error("Could not find node ids");
    }

    // trigger handler: data-handleid="output" data-nodeid={triggerId}
    const triggerHandle = page.locator(
      `[data-handleid="output"][data-nodeid="${triggerId}"]`,
    );
    // action handler: data-handleid="input" data-nodeid={actionId}
    const actionHandle = page.locator(
      `[data-handleid="input"][data-nodeid="${actionId}"]`,
    );

    const triggerBox = await triggerHandle.boundingBox();
    const actionBox = await actionHandle.boundingBox();
    if (!triggerBox || !actionBox) {
      throw new Error("Could not find node handles");
    }

    await page.mouse.move(
      triggerBox.x + triggerBox.width / 2,
      triggerBox.y + triggerBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      actionBox.x + actionBox.width / 2,
      actionBox.y + actionBox.height / 2,
    );
    await page.mouse.up();

    // Validate export modal schema
    await page.getByRole("button", { name: "Export" }).click();

    const textArea = page
      .locator("textarea")
      .filter({ hasText: '"id": "workflow-' });
    await expect(textArea).toBeVisible();

    const workflowJson = await textArea.inputValue();
    const workflow = JSON.parse(workflowJson) as WorkflowDefinition;

    expect(workflow).toBeDefined();
    expect(workflow.id).toContain("workflow-");
    expect(workflow.name).toBe("Test Workflow");
    expect(workflow.description).toBe("This is a test workflow");
    expect(workflow.urlPattern).toBe("https://*");
    expect(workflow.enabled).toBe(true);
    expect(workflow.nodes.length).toBe(2);
    expect(workflow.connections.length).toBe(1);
    expect(workflow.nodes.map((n) => n.type).sort()).toEqual(
      ["trigger", "action"].sort(),
    );
    const triggerNode = workflow.nodes.find((n) => n.id === triggerId);
    const triggerData = triggerNode?.data as TriggerNodeData;
    expect(triggerData.type).toBe("page-load");

    const actionNode = workflow.nodes.find((n) => n.id === actionId);
    const actionData = actionNode?.data as ActionNodeData;
    expect(actionData.type).toBe("show-modal");
    expect(actionData.config).toEqual({
      modalContent: "Hello from Houdin workflow",
    });

    expect(workflow.connections[0]).toEqual({
      id: expect.stringContaining("conn-"),
      source: triggerId,
      target: actionId,
      sourceHandle: "output",
      targetHandle: "input",
    });

    // Close export modal
    await page.getByRole("button", { name: "Close" }).click();

    // Save the workflow
    await page.getByRole("button", { name: "Save & Apply Workflow" }).click();

    // Expect to be back in the workflows tab
    await expect(
      page.getByRole("heading", { name: "Workflows", level: 3 }),
    ).toBeVisible();

    // Expect to see the new workflow in the list
    await expect(page.locator('text="Test Workflow"').first()).toBeVisible();

    // Expect to see description
    await expect(page.getByText("This is a test workflow")).toBeVisible();
  });

  test("can import a workflow", async ({ page, baseUrl }) => {
    await importWorkflow(baseUrl, page);

    // Expect to see the new workflow in the list
    await expect(page.locator('text="Test Workflow"').first()).toBeVisible();

    // Expect to see description
    await expect(page.getByText("This is a test workflow")).toBeVisible();

    // Click on Edit button for the workflow
    await page.locator('button[title="Edit workflow"]').click();

    // Expect to see workflow designer
    await expect(
      page.getByRole("heading", { name: "Edit Workflow", level: 2 }),
    ).toBeVisible();

    // Expect to see 2 nodes in the designer
    await expect(page.locator(".react-flow__node")).toHaveCount(2);

    // Get trigger id
    const triggerId = await page
      .locator(".react-flow__node")
      .filter({ hasText: "Page Load" })
      .getAttribute("data-id");
    expect(triggerId).toEqual("trigger-5rfUmu");

    // Get action id
    const actionId = await page
      .locator(".react-flow__node")
      .filter({ hasText: "Show Modal" })
      .getAttribute("data-id");
    expect(actionId).toEqual("action-P8n5PD");

    // Search for "Page Load" in nodes
    const triggerNode = page
      .locator(".react-flow__node")
      .filter({ hasText: "Page Load" });
    expect(triggerNode).toBeVisible();

    // Search for "Show Modal" in nodes
    const actionNode = page
      .locator(".react-flow__node")
      .filter({ hasText: "Show Modal" });
    expect(actionNode).toBeVisible();
  });

  test("can run a workflow", async ({ page, baseUrl }) => {
    await importWorkflow(baseUrl, page);

    // Go to example.com
    await page.goto("https://example.com");

    // Wait for 1 second
    await page.waitForTimeout(1000);

    // Expect to see the modal with text
    await expect(page.getByText("Hello from Houdin workflow")).toBeVisible();
  });
});
