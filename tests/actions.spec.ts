import { test, expect } from "./test.base";
import { Destinations, importWorkflow, UrlBuilder } from "./utils";
import { DEMO_CUSTOM_SCRIPT_WORKFLOW } from "./demoWorkflows/customScript";
import { DEMO_NOTIFICATION_WORKFLOW } from "./demoWorkflows/notification";
import { DEMO_MODAL_WORKFLOW } from "./demoWorkflows/modal";
import { DEMO_NAVIGATE_URL_WORKFLOW } from "./demoWorkflows/navigateUrl";
import { DEMO_CLIPBOARD_WORKFLOW } from "./demoWorkflows/clipboard";
import { DEMO_INJECT_COMPONENT_WORKFLOW } from "./demoWorkflows/injectCompoment";
import { DEMO_HTTP_REQUEST_WORKFLOW } from "./demoWorkflows/httpRequest";
import { DEMO_COOKIE_WORKFLOW } from "./demoWorkflows/cookie";

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

  test("can execute clipboard action", async ({ page, baseUrl }) => {
    await importWorkflow(baseUrl, page, DEMO_CLIPBOARD_WORKFLOW);
    await page.goto("https://example.com");
    await page.waitForTimeout(10); // wait for clipboard action to complete

    // Read from clipboard
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText();
    });

    expect(clipboardText).toBe("Hello world");
  });

  test("can execute inject component action", async ({ page, baseUrl }) => {
    await importWorkflow(baseUrl, page, DEMO_INJECT_COMPONENT_WORKFLOW);
    await page.goto("https://example.com");

    // search for text "Hello world"
    await expect(page.locator("text=Hello world")).toBeVisible();
  });

  test("can execute http request action", async ({ page, baseUrl }) => {
    await importWorkflow(baseUrl, page, DEMO_HTTP_REQUEST_WORKFLOW);

    const publicIp = await (await fetch("https://api.ipify.org/")).text();

    await page.goto("https://example.com");

    // The modal with public IP should appear
    await expect(page.locator('text="Public IP"')).toBeVisible();
    await expect(page.locator(`text=${publicIp}`)).toBeVisible();
  });

  test("can execute cookie action", async ({ page, baseUrl }) => {
    await importWorkflow(baseUrl, page, DEMO_COOKIE_WORKFLOW);
    await page.goto("https://example.com");

    await expect(page.locator('text="Cookie"')).toBeVisible();
    await expect(page.locator('text="value: bar"')).toBeVisible();
  });
});
