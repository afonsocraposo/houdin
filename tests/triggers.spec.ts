import { DEMO_BUTTON_WORKFLOW } from "./demoWorkflows/button";
import { DEMO_FAB_WORKFLOW } from "./demoWorkflows/fab";
import { DEMO_HTTP_REQUEST_TRIGGER_WORKFLOW } from "./demoWorkflows/httpRequestTrigger";
import { test, expect } from "./test.base";
import { importWorkflow } from "./utils";

test.describe("Actions execution", () => {
  test("can trigger workflow on http request detection", async ({
    page,
    baseUrl,
  }) => {
    await importWorkflow(baseUrl, page, DEMO_HTTP_REQUEST_TRIGGER_WORKFLOW);

    await page.goto("https://example.com");

    await expect
      .poll(async () => {
        await page.evaluate(() => {
          fetch("https://api.ipify.org/");
        });

        return page.locator('text="Request detected"').isVisible();
      })
      .toBe(true);
  });

  test("can trigger workflow on fab click", async ({ page, baseUrl }) => {
    await importWorkflow(baseUrl, page, DEMO_FAB_WORKFLOW);

    await page.goto("https://example.com");

    await page.click('text="FB"');
    await expect(page.locator('text="Workflow triggered"')).toBeVisible();
  });

  test("can trigger workflow on button click", async ({ page, baseUrl }) => {
    await importWorkflow(baseUrl, page, DEMO_BUTTON_WORKFLOW);

    await page.goto("https://example.com");

    await page.click('text="FB"');
    await expect(page.locator('text="Workflow triggered"')).toBeVisible();
  });
});
