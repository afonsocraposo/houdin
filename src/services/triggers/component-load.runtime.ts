import definition from "./component-load.definition";
import { BaseTrigger } from "@/types/triggers";
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
  constructor() {
    super(definition);
  }

  async setup(
    config: ComponentLoadTriggerConfig,
    _workflowId: string,
    _nodeId: string,
    onTrigger: (data: ComponentLoadTriggerOutput) => Promise<void>,
  ): Promise<(() => void) | void> {
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
            return;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }
}
