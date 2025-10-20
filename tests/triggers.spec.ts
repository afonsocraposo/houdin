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

    // fetch https://api.ipify.org from within the page context
    await page.evaluate(() => {
      fetch("https://api.ipify.org/");
    });
    await expect(page.locator('text="Request detected"')).toBeVisible();
  });
});
