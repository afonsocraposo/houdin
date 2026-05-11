import { expect, test } from "./test.base";
import { DEMO_BUTTON_WORKFLOW } from "./demoWorkflows/button";
import { DEMO_WORKFLOW } from "./demoWorkflows/index";
import { seedWorkflows, updateWorkflowsInStore, UrlBuilder, Destinations } from "./utils";

test.describe("Workflow registration and cleanup", () => {
  test("runs a page-load workflow once for a page load", async ({
    page,
    baseUrl,
  }) => {
    await seedWorkflows(baseUrl, page, [DEMO_WORKFLOW]);

    await page.goto("https://example.com");

    await expect(page.getByText("Hello from Houdin workflow")).toBeVisible();
    await expect(page.getByText("Hello from Houdin workflow")).toHaveCount(1);
  });

  test("does not duplicate registered triggers after back and forward", async ({
    page,
    baseUrl,
  }) => {
    await seedWorkflows(baseUrl, page, [DEMO_BUTTON_WORKFLOW]);

    await page.goto("https://example.com");
    await expect(page.getByText("FB")).toHaveCount(1);

    await page.evaluate(() => window.history.pushState({}, "", "/next"));
    await page.waitForURL("https://example.com/next");
    await expect(page.getByText("FB")).toHaveCount(1);

    await page.goBack();
    await page.waitForURL("https://example.com/");
    await expect(page.getByText("FB")).toHaveCount(1);

    await page.goForward();
    await page.waitForURL("https://example.com/next");
    await expect(page.getByText("FB")).toHaveCount(1);
  });

  test("cleans up triggers when the URL no longer matches", async ({
    page,
    baseUrl,
  }) => {
    await seedWorkflows(baseUrl, page, [
      {
        ...DEMO_BUTTON_WORKFLOW,
        urlPattern: "https://example.com/active*",
      },
    ]);

    await page.goto("https://example.com/active");
    await expect(page.getByText("FB")).toHaveCount(1);

    await page.evaluate(() => window.history.pushState({}, "", "/inactive"));
    await page.waitForURL("https://example.com/inactive");

    await expect(page.getByText("FB")).toHaveCount(0);
  });

  test("registers workflows when SPA navigation reaches a target URL", async ({
    page,
    baseUrl,
  }) => {
    await seedWorkflows(baseUrl, page, [
      {
        ...DEMO_WORKFLOW,
        urlPattern: "https://example.com/target*",
      },
    ]);

    await page.goto("https://example.com/start");
    await expect(page.getByText("Hello from Houdin workflow")).toHaveCount(0);

    await page.evaluate(() => window.history.pushState({}, "", "/target"));
    await page.waitForURL("https://example.com/target");

    await expect(page.getByText("Hello from Houdin workflow")).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText("Hello from Houdin workflow")).toHaveCount(1);
  });

  test("re-injects button after workflow is modified without refresh", async ({
    page,
    context,
    baseUrl,
  }) => {
    await seedWorkflows(baseUrl, page, [DEMO_BUTTON_WORKFLOW]);
    await page.goto("https://example.com");
    await expect(page.getByText("FB")).toHaveCount(1);

    const updatedWorkflow = {
      ...DEMO_BUTTON_WORKFLOW,
      modifiedAt: DEMO_BUTTON_WORKFLOW.modifiedAt + 1,
      nodes: DEMO_BUTTON_WORKFLOW.nodes.map((node) =>
        node.type === "trigger"
          ? {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  componentText: "Updated",
                },
              },
            }
          : node,
      ),
    };

    const configPage = await context.newPage();
    await configPage.goto(UrlBuilder(baseUrl, Destinations.WORKFLOWS));
    await updateWorkflowsInStore(configPage, [updatedWorkflow]);
    await configPage.close();

    await expect.poll(() => page.getByText("Updated").count()).toBe(1);
    await expect(page.getByText("FB")).toHaveCount(0);
  });
});
