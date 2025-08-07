import { KeybindingSetter } from "../../components/KeybindingSetter";
import {
  BaseTrigger,
  TriggerConfigSchema,
  TriggerExecutionContext,
  TriggerSetupResult,
} from "../../types/triggers";

export class KeyPressTrigger extends BaseTrigger {
  readonly metadata = {
    type: "key-press",
    label: "Key Press",
    icon: "⌨️",
    description: "Trigger when a specific key is pressed",
  };

  getConfigSchema(): TriggerConfigSchema {
    return {
      properties: {
        keyCode: {
          type: "custom",
          label: "Key Code",
          render: (_values: Record<string, any>) => <KeybindingSetter />,
        },
      },
    };
  }

  getDefaultConfig(): Record<string, any> {
    return {
      selector: "",
    };
  }

  async setup(
    config: Record<string, any>,
    _context: TriggerExecutionContext,
    onTrigger: () => Promise<void>,
  ): Promise<TriggerSetupResult> {
    const selector = config.selector;

    // Check if element already exists
    const existingElement = document.querySelector(selector);
    if (existingElement) {
      await onTrigger();
      return {};
    }

    // Set up observer to watch for element
    const observer = new MutationObserver(async (mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          const element = document.querySelector(selector);
          if (element) {
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

    // Clean up after 30 seconds to prevent memory leaks
    const timeoutId = window.setTimeout(() => {
      observer.disconnect();
      console.log(`Component load trigger timed out for selector: ${selector}`);
    }, 30000);

    return {
      cleanup: () => {
        observer.disconnect();
        clearTimeout(timeoutId);
      },
    };
  }
}
