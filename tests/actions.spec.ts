import { test, expect } from "./test.base";
import { Destinations, importWorkflow, UrlBuilder } from "./utils";
import { DEMO_CUSTOM_SCRIPT_WORKFLOW } from "./demoWorkflows/customScript";
import { DEMO_NOTIFICATION_WORKFLOW } from "./demoWorkflows/notification";
import { DEMO_MODAL_WORKFLOW } from "./demoWorkflows/modal";
import { DEMO_NAVIGATE_URL_WORKFLOW } from "./demoWorkflows/navigateUrl";

test.describe("Actions execution", () => {
  // always go to config page before each test
  test.beforeEach(async ({ page, baseUrl }) => {
    await page.goto(UrlBuilder(baseUrl, Destinations.WORKFLOWS));
    await expect(page.locator("body")).toBeVisible();
    // Check that Workflows tab has h3 title
    await expect(
      page.getByRole("heading", { name: "Workflows", level: 3 }),
    ).toBeVisible();
  });

  test("can execute custom script action", async ({ page, baseUrl }) => {
    await importWorkflow(baseUrl, page, DEMO_CUSTOM_SCRIPT_WORKFLOW);

    // Go to example.com
    await page.goto("https://example.com");

    const injectedElement = page.locator("#test-custom-script");
    await expect(injectedElement).toBeVisible();
    await expect(injectedElement).toHaveText("Hello world");
  });

  test("can execute notification action", async ({ page, baseUrl }) => {
    await importWorkflow(baseUrl, page, DEMO_NOTIFICATION_WORKFLOW);
    await page.goto("https://example.com");

    await expect(page.locator('text="Test notification"')).toBeVisible();
    await expect(page.locator('text="Hello world"')).toBeVisible();
  });

  test("can execute modal action", async ({ page, baseUrl }) => {
    await importWorkflow(baseUrl, page, DEMO_MODAL_WORKFLOW);
    await page.goto("https://example.com");

    await expect(page.locator('text="Test modal"')).toBeVisible();
    const modalContent = page.locator(".mantine-Title-root");
    await expect(modalContent).toBeVisible();
    await expect(modalContent).toHaveText("Hello world");
    await expect(modalContent).toHaveAttribute("data-order", "2");
  });

  test("can execute navigate URL action", async ({ page, baseUrl }) => {
    await importWorkflow(baseUrl, page, DEMO_NAVIGATE_URL_WORKFLOW);
    await page.goto("https://example.com");

    // After page load, should navigate to example.org
    await expect(page).toHaveURL("https://example.org/");

    // The notification should also appear
    await expect(page.locator('text="Test notification"')).toBeVisible();
    await expect(page.locator('text="Hello world"')).toBeVisible();
  });
});
