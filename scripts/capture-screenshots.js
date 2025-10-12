#!/usr/bin/env node

import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const distPath = path.join(projectRoot, "dist");
const screenshotsPath = path.join(projectRoot, "screenshots");

// Ensure screenshots directory exists
if (!existsSync(screenshotsPath)) {
  mkdirSync(screenshotsPath, { recursive: true });
}

async function simulateExecution(page) {
  // open new tab on example.com
  const newPage = await page.context().newPage();
  await newPage.setViewportSize({ width: 1280, height: 800 });
  await newPage.goto("https://example.com");
  await newPage.waitForTimeout(2000); // wait for 2 seconds

  // Take screenshot of workflow execution on example.com
  console.log("📸 Capturing workflow execution on example.com...");
  await newPage.screenshot({
    path: path.join(screenshotsPath, "4-workflow-execution-example.png"),
  });
  console.log("✅ Workflow execution screenshot saved");

  await newPage.close();
}

async function captureScreenshots() {
  console.log("🚀 Starting screenshot capture process...");

  if (!existsSync(distPath)) {
    throw new Error('Extension not built. Run "npm run build" first.');
  }

  // Setup browser context with extension loaded (like e2e tests)
  const isHeadless = process.env.HEADLESS !== "false";
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      isHeadless ? `--headless=new` : "",
      `--disable-extensions-except=${distPath}`,
      `--load-extension=${distPath}`,
    ].filter(Boolean),
  });

  try {
    // Wait for service worker like in the e2e tests
    let background = context.serviceWorkers()[0];
    if (!background) {
      console.log("Waiting for service worker...");
      background = await context.waitForEvent("serviceworker");
    }

    const extensionId = background.url().split("/")[2];
    const baseUrl = `chrome-extension://${extensionId}/src/config/index.html#/`;

    console.log(`📱 Extension loaded with ID: ${extensionId}`);

    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

    // Go to the extension's config page
    await page.goto(baseUrl);

    // Click button, aria-label="Create workflow from example"
    await page.click('button[aria-label="Create workflow from example"]');
    // Click button with text "API Request IP"
    await page.getByRole("menuitem", { name: "API Request IP" }).click();
    await page.getByRole("button", { name: "Save & Apply Workflow" }).click();

    await page.click('button[aria-label="Create workflow from example"]');
    await page
      .getByRole("menuitem", { name: "Copy current URL to clipboard" })
      .click();
    await page.getByRole("button", { name: "Save & Apply Workflow" }).click();

    await page.click('button[aria-label="Create workflow from example"]');
    await page.getByRole("menuitem", { name: "Welcome Message" }).click();
    await page.getByRole("button", { name: "Save & Apply Workflow" }).click();

    // Add execution history
    await simulateExecution(page);

    // 1. Screenshot: Config interface with workflows
    console.log("📸 Capturing config interface with workflows...");
    await page.goto(`${baseUrl}?tab=workflows`);

    // Wait for workflows to load
    await page.getByRole("heading", { name: "Workflows", level: 3 }).waitFor();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(screenshotsPath, "1-config-interface-workflows.png"),
    });
    console.log("✅ Config interface screenshot saved");

    // 2. Screenshot: Workflow designer with complex workflow
    console.log("📸 Capturing workflow designer with complex workflow...");

    // Add Summarize News workflow for designer screenshot
    await page.click('button[aria-label="Create workflow from example"]');
    await page.getByRole("menuitem", { name: "Summarize News" }).click();

    // Wait for designer to load
    await page
      .getByRole("heading", { name: "Create Workflow", level: 2 })
      .waitFor();
    await page.waitForTimeout(2000);

    // Take screenshot with add node drawer open
    await page.locator("#add-node-button").click();
    await page.getByText("Add Node").waitFor();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotsPath, "2a-workflow-designer-drawer.png"),
    });
    console.log("✅ Workflow designer with drawer screenshot saved");

    // Close the drawer
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Click on OpenAI node to show properties
    const openAINode = page
      .locator(".react-flow__node")
      .filter({ hasText: "OpenAI" })
      .first();
    if (await openAINode.isVisible()) {
      // click on text "OpenAI" within the node
      await openAINode.getByText("OpenAI").click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(screenshotsPath, "2b-workflow-designer-properties.png"),
    });
    console.log("✅ Workflow designer with properties screenshot saved");

    // 3. Screenshot: History section with execution output
    console.log("📸 Capturing history section with execution output...");

    // Ensure viewport is set to correct size
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${baseUrl}?tab=history`);

    // Wait for history page to load
    await page
      .getByRole("heading", { name: "Execution history", level: 2 })
      .waitFor();
    await page.waitForTimeout(2000);

    // Click on button with class .expander
    page.locator(".expander").first().click();
    await page.waitForTimeout(1000);

    // Click on "View Output" for one of the nodes to show the modal
    const viewOutputButtons = page.locator('text="View Output"');
    const buttonCount = await viewOutputButtons.count();
    if (buttonCount > 1) {
      await viewOutputButtons.nth(1).click(); // Click on second "View Output"
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(screenshotsPath, "3-history-execution-output.png"),
    });
    console.log("✅ History section screenshot saved");

    console.log("🎉 All screenshots captured successfully!");
    console.log(`📂 Screenshots saved to: ${screenshotsPath}`);
    console.log("\n📸 Generated screenshots:");
    console.log(
      "  1. 1-config-interface-workflows.png - Main config with workflow list",
    );
    console.log(
      "  2a. 2a-workflow-designer-drawer.png - Designer with add node drawer open",
    );
    console.log(
      "  2b. 2b-workflow-designer-properties.png - Designer with OpenAI node properties",
    );
    console.log(
      "  3. 3-history-execution-output.png - Execution history with output details",
    );
    console.log(
      "  4. 4-workflow-execution-example.png - Workflow execution on example.com",
    );
  } finally {
    await context.close();
  }
}

// Run the screenshot capture
captureScreenshots().catch((error) => {
  console.error("❌ Screenshot capture failed:", error);
  process.exit(1);
});
