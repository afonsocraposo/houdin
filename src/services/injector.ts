import { WorkflowDefinition } from "../types/workflow";
import { StorageManager } from "../services/storage";
import { WorkflowExecutor } from "../services/workflow";
import { createRoot, Root } from "react-dom/client";
import mantineStyles from "@mantine/core/styles.css?inline";
import mantineNotificationsStyles from "@mantine/notifications/styles.css?inline";
import MantineDispatcher from "../content/mantineDispatcher";
import CustomMantineProvider from "../content/mantineProvider";

const MANTINE_INJECTOR_ROOT_ID = "mantine-injector-root";
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

  private static getParentShadowRoot(
    target: Element,
    rootId: string,
  ): { root: Root | null; hostDiv: HTMLElement | null } {
    try {
      const container = document.createElement("span");
      container.id = rootId;
      container.setAttribute("data-workflow-injected", "true");

      // Attach a Shadow Root
      const shadowRoot = container.attachShadow({ mode: "closed" });

      // Append the container to the body
      target.append(container);

      // Inject Mantine styles into the Shadow DOM
      const mantineStyleTag = document.createElement("style");
      mantineStyleTag.textContent = mantineStyles;
      shadowRoot.appendChild(mantineStyleTag);

      // Inject Mantine Notifications styles into the Shadow DOM
      const notificationsStyleTag = document.createElement("style");
      notificationsStyleTag.textContent = mantineNotificationsStyles;
      shadowRoot.appendChild(notificationsStyleTag);

      // Create a container for React to mount
      const hostDiv = document.createElement("span");
      hostDiv.setAttribute("id", "app");
      shadowRoot.appendChild(hostDiv);

      // Create a React root and render the app
      const root = createRoot(hostDiv);
      return { root, hostDiv };
    } catch (error) {
      console.error("Error Injecting React:", error);
    }
    return { root: null, hostDiv: null };
  }

  public static injectMantineComponentInTarget(
    rootId: string,
    component: JSX.Element,
    target: Element,
  ): void {
    const { root, hostDiv } = this.getParentShadowRoot(target, rootId);
    if (!root || !hostDiv) {
      console.error("Failed to create React root or app element.");
      return;
    }
    root.render(
      CustomMantineProvider({
        parent: hostDiv,
        children: component,
      }),
    );
  }

  private injectMantineDispatcher(rootId: string): void {
    const body = document.querySelector("body");
    if (!body) throw new Error("Body element not found.");
    ContentInjector.injectMantineComponentInTarget(
      rootId,
      MantineDispatcher(),
      body,
    );
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

  private async processWorkflows(): Promise<void> {
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

    // Remove any previously injected components for workflows that no longer match
    this.cleanupInjectedComponents();

    // Inject Mantine dispatcher
    this.injectMantineDispatcher(MANTINE_INJECTOR_ROOT_ID);

    // wait 100ms
    await new Promise((resolve) => setTimeout(resolve, 1));

    if (matchingWorkflows.length > 0) {
      console.log(
        `Found ${matchingWorkflows.length} matching workflows for ${currentUrl}`,
      );

      // Start new executors for matching workflows
      matchingWorkflows.forEach((workflow) => {
        const executor = new WorkflowExecutor(workflow);
        this.activeExecutors.set(workflow.id, executor);

        executor.execute().catch((error) => {
          console.error(`Error executing workflow ${workflow.name}:`, error);
        });
      });
    }
  }

  private stopActiveExecutors(): void {
    this.activeExecutors.forEach((executor) => {
      executor.destroy();
    });
    this.activeExecutors.clear();
  }

  private cleanupInjectedComponents(): void {
    console.debug("Cleaning up injected components");
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
