import { createRoot, Root } from "react-dom/client";
import MantineDispatcher from "@/content/mantineDispatcher";
import CustomMantineProvider from "@/content/mantineProvider";

const MANTINE_INJECTOR_ROOT_ID = "mantine-injector-root";
export class ContentInjector {
  private urlObserver: MutationObserver | null = null;
  private processTimeout: number | null = null;

  async initialize(): Promise<void> {
    console.debug("Content injector initialized");
    this.injectMantineDispatcher(MANTINE_INJECTOR_ROOT_ID);
  }

  private static getParentShadowRoot(
    target: Element,
    rootId: string,
    position: "start" | "end" = "end",
  ): { root: Root | null; hostDiv: HTMLElement | null } {
    try {
      // Check if container already exists
      const existingContainer = document.getElementById(rootId);
      if (existingContainer) {
        console.debug(`Container ${rootId} already exists, skipping injection`);
        return { root: null, hostDiv: null };
      }

      const container = document.createElement("span");
      container.id = rootId;
      container.setAttribute("data-workflow-injected", "true");
      if (rootId === MANTINE_INJECTOR_ROOT_ID) {
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "0";
        container.style.height = "0";
        container.style.overflow = "visible";
        container.style.pointerEvents = "none";
        container.style.zIndex = "2147483647"; // Maximum z-index to ensure it's on top
      }

      // Attach a Shadow Root
      const shadowRoot = container.attachShadow({ mode: "open" });

      // Inject the container at the specified position
      if (position === "start") {
        target.prepend(container);
      } else {
        target.append(container);
      }

      // Create a container for React to mount
      const hostDiv = document.createElement("div");
      hostDiv.setAttribute("id", "app");
      hostDiv.style.pointerEvents = "auto";
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
    coreOnly: boolean = false,
    position: "start" | "end" = "end",
  ): void {
    const { root, hostDiv } = this.getParentShadowRoot(
      target,
      rootId,
      position,
    );
    if (!root || !hostDiv) {
      console.error("Failed to create React root or app element.");
      return;
    }
    root.render(
      CustomMantineProvider({
        parent: hostDiv,
        children: component,
        coreOnly,
      }),
    );
  }

  private injectMantineDispatcher(rootId: string): void {
    // Check if mantine dispatcher already exists
    if (document.getElementById(rootId)) {
      return; // Already injected, skip
    }

    const body = document.querySelector("body");
    if (!body) throw new Error("Body element not found.");
    ContentInjector.injectMantineComponentInTarget(
      rootId,
      MantineDispatcher(),
      body,
    );
  }

  private cleanupInjectedComponents(): void {
    console.debug("Cleaning up injected components");

    // Clean up modals and notifications via events instead of re-injection
    window.dispatchEvent(new CustomEvent("modalCleanup"));
    window.dispatchEvent(new CustomEvent("notificationCleanup"));

    // Remove all components injected by workflows, but preserve the mantine dispatcher
    const injectedComponents = document.querySelectorAll(
      '[data-workflow-injected="true"]:not(#mantine-injector-root)',
    );
    injectedComponents.forEach((component) => {
      if (component.parentNode) {
        component.parentNode.removeChild(component);
      }
    });
  }

  destroy(): void {
    this.cleanupInjectedComponents();

    if (this.urlObserver) {
      this.urlObserver.disconnect();
    }
    if (this.processTimeout) {
      clearTimeout(this.processTimeout);
    }
  }
}
