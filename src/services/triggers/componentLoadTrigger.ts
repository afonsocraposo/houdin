import {
  BaseTrigger,
  TriggerConfigSchema,
  TriggerExecutionContext,
  TriggerSetupResult,
} from "../../types/triggers";
import { NotificationService } from "../notification";

interface ComponentLoadTriggerConfig {
  selector: string;
  timeout?: number;
}

export class ComponentLoadTrigger extends BaseTrigger<ComponentLoadTriggerConfig> {
  readonly metadata = {
    type: "component-load",
    label: "Component Load",
    icon: "🎯",
    description: "Trigger when specific element appears",
  };

  getConfigSchema(): TriggerConfigSchema {
    return {
      properties: {
        selector: {
          type: "text",
          label: "CSS Selector",
          placeholder: '.my-element, #my-id, [data-testid="test"]',
          description: "CSS selector for the element to watch for",
          required: true,
        },
        timeout: {
          type: "number",
          label: "Timeout (seconds)",
          placeholder: "30",
          description: "How long to wait before showing error (default: 30s)",
          defaultValue: 30,
        },
      },
    };
  }

  getDefaultConfig(): ComponentLoadTriggerConfig {
    return {
      selector: "",
      timeout: 30,
    };
  }

  async setup(
    config: ComponentLoadTriggerConfig,
    _context: TriggerExecutionContext,
    onTrigger: () => Promise<void>,
  ): Promise<TriggerSetupResult> {
    const selector = config.selector;
    const timeoutSeconds = config.timeout || 30;
    let hasTriggered = false;

    // Check if element already exists
    const existingElement = document.querySelector(selector);
    if (existingElement) {
      hasTriggered = true;
      await onTrigger();
      return {};
    }

    // Set up observer to watch for element
    const observer = new MutationObserver(async (mutations) => {
      if (hasTriggered) return;
      
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          const element = document.querySelector(selector);
          if (element) {
            hasTriggered = true;
            observer.disconnect();
            await onTrigger();
            return;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Show error notification if component doesn't load within timeout
    const timeoutId = window.setTimeout(() => {
      if (!hasTriggered) {
        observer.disconnect();
        console.debug(
          `Component load trigger timed out for selector: ${selector}`,
        );
        NotificationService.showErrorNotification({
          title: "Component Load Timeout",
          message: `Element "${selector}" did not load within ${timeoutSeconds} seconds`,
        });
      }
    }, timeoutSeconds * 1000);

    return {
      cleanup: () => {
        observer.disconnect();
        clearTimeout(timeoutId);
      },
    };
  }
}
