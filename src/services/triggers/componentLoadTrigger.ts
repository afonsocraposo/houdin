import { BaseTrigger } from "@/types/triggers";
import {
  selectProperty,
  textProperty,
  numberProperty,
} from "@/types/config-properties";
import { getElement } from "@/utils/helpers";

interface ComponentLoadTriggerConfig {
  selectorType: "css" | "xpath" | "text";
  selector: string;
  timeout?: number;
}

interface ComponentLoadTriggerOutput {
  element: string;
}

export class ComponentLoadTrigger extends BaseTrigger<
  ComponentLoadTriggerConfig,
  ComponentLoadTriggerOutput
> {
  static readonly metadata = {
    type: "component-load",
    label: "Component Load",
    icon: "🎯",
    description: "Trigger when specific element appears",
  };

  readonly configSchema = {
    properties: {
      selectorType: selectProperty({
        label: "Selector Type",
        options: [
          { label: "CSS Selector", value: "css" },
          { label: "XPath", value: "xpath" },
          { label: "Text", value: "text" },
        ],
        defaultValue: "css",
        description: "Type of selector to use for element selection",
        required: true,
      }),
      selector: textProperty({
        label: "CSS Selector",
        placeholder: '.my-element, #my-id, [data-testid="test"]',
        description: "Selector for the element to watch for",
        required: true,
      }),
      timeout: numberProperty({
        label: "Timeout (seconds)",
        placeholder: "30",
        description: "How long to wait before showing error (default: 30s)",
        defaultValue: 30,
      }),
    },
  };

  readonly outputExample = {
    element: '<div class="loaded-element">Content</div>',
  };

  async setup(
    config: ComponentLoadTriggerConfig,
    _workflowId: string,
    _nodeId: string,
    onTrigger: (data: ComponentLoadTriggerOutput) => Promise<void>,
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
