import {
  BaseTrigger,
  TriggerConfigSchema,
  TriggerExecutionContext,
  TriggerSetupResult,
} from "../../types/triggers";
import { getElement } from "../../utils/helpers";
import { NotificationService } from "../notification";

interface ComponentLoadTriggerConfig {
  selectorType: "css" | "xpath" | "text";
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
        selectorType: {
          type: "select",
          label: "Selector Type",
          options: [
            { label: "CSS Selector", value: "css" },
            { label: "XPath", value: "xpath" },
            { label: "Text", value: "text" },
          ],
          defaultValue: "css",
          description: "Type of selector to use for element selection",
          required: true,
        },
        selector: {
          type: "text",
          label: "CSS Selector",
          placeholder: '.my-element, #my-id, [data-testid="test"]',
          description: "Selector for the element to watch for",
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

  async setup(
    config: ComponentLoadTriggerConfig,
    _workflowId: string,
    _nodeId: string,
    onTrigger: (data?: any) => Promise<void>,
  ): Promise<void> {
    const selector = config.selector;
    let hasTriggered = false;

    // Check if element already exists
    const existingElement = getElement(selector, config.selectorType);
    if (existingElement) {
      hasTriggered = true;
      await onTrigger({ element: existingElement.outerHTML });
      return;
    }

    // Set up observer to watch for element
    const observer = new MutationObserver(async (mutations) => {
      if (hasTriggered) return;

      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          const element = getElement(selector, config.selectorType);
          if (element) {
            hasTriggered = true;
            observer.disconnect();
            onTrigger({ element: element.outerHTML });
            observer.disconnect();
            return;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}
