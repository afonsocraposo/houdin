import { WorkflowDefinition } from "../types/workflow";
import { StorageManager } from "../services/storage";
import { WorkflowExecutor } from "../services/workflow";
import MantineApp from "../content/mantineApp";
import { createRoot } from "react-dom/client";
import mantineStyles from "@mantine/core/styles.css?inline";

export class ContentInjector {
  private workflows: WorkflowDefinition[] = [];
  private storageManager: StorageManager;
  private urlObserver: MutationObserver | null = null;
  private lastUrl: string = location.href;
  private activeExecutors: Map<string, WorkflowExecutor> = new Map();
  private processTimeout: number | null = null;

  constructor() {
    this.storageManager = StorageManager.getInstance();
    this.setupUrlChangeListener();
  }

  async initialize(): Promise<void> {
    console.log("Content injector initialized");
    this.injectReact("mantine-injector-root");
    await this.loadWorkflows();
    this.setupStorageListener();
    this.processWorkflows();
  }

  private async loadWorkflows(): Promise<void> {
    this.workflows = await this.storageManager.getWorkflows();
    console.log("Loaded workflows:", this.workflows.length);
  }

  private setupStorageListener(): void {
    this.storageManager.onStorageChanged((workflows) => {
      console.log("Workflows updated, reloading...");
      this.workflows = workflows;
      this.scheduleProcessing();
    });
  }

  private injectReact(rootId: string): void {
    try {
      const body = document.querySelector("body");
      if (!body) throw new Error("Body element not found.");

      const app = document.createElement("div");
      app.id = rootId;

      // Attach a Shadow Root
      const shadowRoot = app.attachShadow({ mode: "closed" });

      // Append the app container to the body
      body.append(app);

      // Create a container for React to mount
      const appElement = document.createElement("div");
      appElement.setAttribute("id", "app");
      shadowRoot.appendChild(appElement);

      // Inject Mantine styles into the Shadow DOM
      const mantineStyleTag = document.createElement("style");
      mantineStyleTag.textContent = mantineStyles;
      shadowRoot.appendChild(mantineStyleTag);

      // Create a React root and render the app
      const root = createRoot(appElement);
      root.render(MantineApp(appElement));
      console.debug("Modal dispatcher injected successfully.");
    } catch (error) {
      console.error("Error Injecting React:", error);
    }
  }

  private setupUrlChangeListener(): void {
    this.urlObserver = new MutationObserver(() => {
      const url = location.href;
      if (url !== this.lastUrl) {
        this.lastUrl = url;
        console.log("URL changed, processing workflows");
        this.scheduleProcessing();
      }
    });
    this.urlObserver.observe(document, { subtree: true, childList: true });

    // Also listen for popstate events (back/forward navigation)
    window.addEventListener("popstate", () => {
      const url = location.href;
      if (url !== this.lastUrl) {
        this.lastUrl = url;
        console.log("URL changed via navigation, processing workflows");
        this.scheduleProcessing();
      }
    });
  }

  private scheduleProcessing(): void {
    // Debounce processing calls
    if (this.processTimeout) {
      clearTimeout(this.processTimeout);
    }

    this.processTimeout = window.setTimeout(() => {
      this.processWorkflows();
    }, 500);
  }

  private processWorkflows(): void {
    // Clear processing timeout
    if (this.processTimeout) {
      clearTimeout(this.processTimeout);
      this.processTimeout = null;
    }

    // Stop all active executors
    this.stopActiveExecutors();

    const currentUrl = window.location.href;
    const matchingWorkflows = this.workflows.filter(
      (workflow) =>
        workflow.enabled &&
        this.matchesUrlPattern(workflow.urlPattern, currentUrl),
    );

    if (matchingWorkflows.length > 0) {
      console.log(
        `Found ${matchingWorkflows.length} matching workflows for ${currentUrl}`,
      );

      // Remove any previously injected components for workflows that no longer match
      this.cleanupInjectedComponents();

      // Start new executors for matching workflows
      matchingWorkflows.forEach((workflow) => {
        const executor = new WorkflowExecutor(workflow);
        this.activeExecutors.set(workflow.id, executor);

        executor.execute().catch((error) => {
          console.error(`Error executing workflow ${workflow.name}:`, error);
        });
      });
    } else {
      // No matching workflows, clean up any injected components
      this.cleanupInjectedComponents();
    }
  }

  private stopActiveExecutors(): void {
    this.activeExecutors.forEach((executor) => {
      executor.destroy();
    });
    this.activeExecutors.clear();
  }

  private cleanupInjectedComponents(): void {
    // Remove all components injected by workflows
    const injectedComponents = document.querySelectorAll(
      '[data-workflow-injected="true"]',
    );
    injectedComponents.forEach((component) => {
      if (component.parentNode) {
        component.parentNode.removeChild(component);
      }
    });
  }

  private matchesUrlPattern(pattern: string, url: string): boolean {
    try {
      // Convert simple wildcard pattern to regex
      const regexPattern = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape special regex characters
        .replace(/\\\*/g, ".*") // Convert * to .*
        .replace(/\\\?/g, "."); // Convert ? to .

      const regex = new RegExp(`^${regexPattern}$`, "i");
      return regex.test(url);
    } catch (error) {
      console.error("Invalid URL pattern:", pattern, error);
      return false;
    }
  }

  destroy(): void {
    this.stopActiveExecutors();
    this.cleanupInjectedComponents();

    if (this.urlObserver) {
      this.urlObserver.disconnect();
    }
    if (this.processTimeout) {
      clearTimeout(this.processTimeout);
    }
  }
}
