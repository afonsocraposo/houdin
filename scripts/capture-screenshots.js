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

const apiRequestIP = {
  connections: [
    {
      id: "conn-HlP1wD",
      source: "trigger-Nocdk7",
      sourceHandle: "output",
      target: "action-Hi5qne",
      targetHandle: "input",
    },
    {
      id: "conn-QgA5iL",
      source: "action-Hi5qne",
      sourceHandle: "output",
      target: "action-aBmfbg",
      targetHandle: "input",
    },
  ],
  description: "Use ipify public IP to figure out current public IP.",
  enabled: true,
  id: "workflow-gapi8s9c2ukY",
  modifiedAt: 1759441266664,
  name: "API Request IP",
  nodes: [
    {
      data: {
        config: {
          buttonColor: "#868e96",
          buttonTextColor: "#ffffff",
          componentText: "🌍",
          componentType: "fab",
          selectorType: "css",
          targetSelector: "body",
        },
        type: "button-click",
      },
      id: "trigger-Nocdk7",
      inputs: [],
      outputs: ["output"],
      position: { x: 0, y: 0 },
      type: "trigger",
    },
    {
      data: {
        config: {
          url: "https://api.ipify.org?format=json",
        },
        type: "http-request",
      },
      id: "action-Hi5qne",
      inputs: ["input"],
      outputs: ["output"],
      position: { x: 300, y: 0 },
      type: "action",
    },
    {
      data: {
        config: {
          modalContent: "{{action-Hi5qne.data.ip}}",
          modalTitle: "My Public IP is...",
        },
        type: "show-modal",
      },
      id: "action-aBmfbg",
      inputs: ["input"],
      outputs: ["output"],
      position: { x: 600, y: 0 },
      type: "action",
    },
  ],
  urlPattern: "https://*",
};

const copyUrlClipboard = {
  connections: [
    {
      id: "conn-4jcwE0",
      source: "trigger-nIiFrD",
      sourceHandle: "output",
      target: "action-yuYRUq",
      targetHandle: "input",
    },
    {
      id: "conn-mgt7HS",
      source: "action-yuYRUq",
      sourceHandle: "output",
      target: "action-eWGxxw",
      targetHandle: "input",
    },
  ],
  description: "",
  enabled: true,
  id: "workflow-DEEvluCY1ZUo",
  modifiedAt: 1759681061210,
  name: "Copy current URL to clipboard",
  nodes: [
    {
      data: {
        config: { keyCombo: "Ctrl + C" },
        type: "key-press",
      },
      id: "trigger-nIiFrD",
      inputs: [],
      outputs: ["output"],
      position: { x: 300, y: 100 },
      type: "trigger",
    },
    {
      data: {
        config: { text: "{{meta.url}}" },
        type: "write-clipboard",
      },
      id: "action-yuYRUq",
      inputs: ["input"],
      outputs: ["output"],
      position: { x: 600, y: 100 },
      type: "action",
    },
    {
      data: {
        config: {
          notificationContent: "{{action-yuYRUq.text}}",
          notificationTitle: "✅ Copied URL!",
        },
        type: "show-notification",
      },
      id: "action-eWGxxw",
      inputs: ["input"],
      outputs: ["output"],
      position: { x: 900, y: 100 },
      type: "action",
    },
  ],
  urlPattern: "https://*",
};

const welcomeMessage = {
  id: "example-welcome-message",
  name: "Welcome Message",
  description: "Show a welcome modal when the page loads",
  urlPattern: "https://*",
  enabled: true,
  nodes: [
    {
      id: "trigger-example-welcome",
      type: "trigger",
      position: { x: 300, y: 100 },
      data: {
        type: "page-load",
        config: {},
      },
      inputs: [],
      outputs: ["output"],
    },
    {
      id: "action-example-welcome",
      type: "action",
      position: { x: 600, y: 100 },
      data: {
        type: "show-modal",
        config: {
          modalContent: "Welcome! This workflow was created from an example.",
        },
      },
      inputs: ["input"],
      outputs: ["output"],
    },
  ],
  connections: [
    {
      id: "conn-example-welcome",
      source: "trigger-example-welcome",
      sourceHandle: "output",
      target: "action-example-welcome",
      targetHandle: "input",
    },
  ],
  modifiedAt: 0,
};

const summarizeNews = {
  connections: [
    {
      id: "conn-Hd2cD3",
      source: "trigger-vwidyP",
      sourceHandle: "output",
      target: "action-wARdUQ",
      targetHandle: "input",
    },
    {
      id: "conn-EjQFtu",
      source: "trigger-6CrmZl",
      sourceHandle: "output",
      target: "action-qjORtw",
      targetHandle: "input",
    },
    {
      id: "conn-WXNqri",
      source: "action-qjORtw",
      sourceHandle: "output",
      target: "action-Tc6M6H",
      targetHandle: "input",
    },
    {
      id: "conn-wzAe5A",
      source: "action-Tc6M6H",
      sourceHandle: "output",
      target: "action-xAspFI",
      targetHandle: "input",
    },
  ],
  description:
    "Uses OpenAI to summarize CNN's news article and injects the summary at the top of the page",
  enabled: true,
  id: "workflow-Wdf7eudQPW0r",
  modifiedAt: 1758988717106,
  name: "Summarize News",
  nodes: [
    {
      data: {
        config: {},
        type: "page-load",
      },
      id: "trigger-6CrmZl",
      inputs: [],
      outputs: ["output"],
      position: { x: 0, y: 0 },
      type: "trigger",
    },
    {
      data: {
        config: {
          selector: ".article__content",
        },
        type: "get-element-content",
      },
      id: "action-qjORtw",
      inputs: ["input"],
      outputs: ["output"],
      position: { x: 300, y: 0 },
      type: "action",
    },
    {
      data: {
        config: {
          credentialId: "",
          prompt: "Summarize this news article:\n{{action-qjORtw}}",
        },
        type: "llm-openai",
      },
      id: "action-Tc6M6H",
      inputs: ["input"],
      outputs: ["output"],
      position: { x: 600, y: 0 },
      type: "action",
    },
    {
      data: {
        config: {
          componentHtml: "<b>Hello</b>, <i>world</i>!",
          componentText: "{{action-Tc6M6H.response}}",
          componentType: "text",
          selectorType: "css",
          targetSelector: ".headline__wrapper",
          textColor: "#000000",
          useMarkdown: true,
        },
        type: "inject-component",
      },
      id: "action-xAspFI",
      inputs: ["input"],
      outputs: ["output"],
      position: { x: 900, y: 0 },
      type: "action",
    },
  ],
  urlPattern: "https://edition.cnn.com/*",
};

function createStoredState(workflows, executions) {
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

async function seedStore(page, workflows, executions = []) {
  const storeValue = JSON.stringify(createStoredState(workflows, executions));
  await page.evaluate(async ({ storeValue }) => {
    localStorage.setItem("urlAlertDismissed", "true");
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ "houdin-store": storeValue }, () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve();
      });
    });
  }, { storeValue });
}

async function seedDesignerDraft(page, workflow) {
  await page.evaluate((draft) => {
    sessionStorage.setItem("workflow-draft-example", JSON.stringify(draft));
  }, workflow);
}

function createSampleExecution() {
  const startedAt = Date.now() - 5000;
  const completedAt = startedAt + 1840;

  return {
    id: "execution-screenshot-sample",
    workflowId: apiRequestIP.id,
    triggerType: "button-click",
    startedAt,
    completedAt,
    status: "completed",
    url: "https://example.com",
    nodeResults: [
      {
        nodeId: "trigger-Nocdk7",
        nodeType: "trigger",
        nodeName: "Button Click",
        nodeConfig: apiRequestIP.nodes[0].data.config,
        status: "success",
        data: { clicked: true },
        executedAt: startedAt + 120,
        duration: 120,
      },
      {
        nodeId: "action-Hi5qne",
        nodeType: "action",
        nodeName: "HTTP Request",
        nodeConfig: apiRequestIP.nodes[1].data.config,
        status: "success",
        data: { data: { ip: "203.0.113.42" }, status: 200 },
        executedAt: startedAt + 720,
        duration: 540,
      },
      {
        nodeId: "action-aBmfbg",
        nodeType: "action",
        nodeName: "Show Modal",
        nodeConfig: apiRequestIP.nodes[2].data.config,
        status: "success",
        data: { title: "My Public IP is...", content: "203.0.113.42" },
        executedAt: completedAt,
        duration: 180,
      },
    ],
  };
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

    await page.goto(baseUrl);
    await seedStore(page, [apiRequestIP, copyUrlClipboard, welcomeMessage], [
      createSampleExecution(),
    ]);

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

    await page.goto(baseUrl);
    await seedDesignerDraft(page, summarizeNews);
    await page.goto(`${baseUrl}designer?init=example`);

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
