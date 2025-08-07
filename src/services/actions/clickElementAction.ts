import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
  ActionExecutionContext,
} from "../../types/actions";
import { NotificationService } from "../notification";

export class ClickElementAction extends BaseAction {
  readonly metadata: ActionMetadata = {
    type: "click-element",
    label: "Click Element",
    icon: "🖱️",
    description: "Click on a page element",
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        elementSelector: {
          type: "text",
          label: "Element Selector",
          placeholder: ".title, #content, h1",
          description: "CSS selector for the element to click",
          required: true,
          defaultValue: "button",
        },
      },
    };
  }

  getDefaultConfig(): Record<string, any> {
    return {
      elementSelector: "button",
    };
  }

  async execute(
    config: Record<string, any>,
    context: ActionExecutionContext,
    nodeId: string,
  ): Promise<void> {
    const { elementSelector } = config;

    const element = document.querySelector(elementSelector);
    if (element) {
      // Simulate a click on the element
      element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    } else {
      NotificationService.showErrorNotification({
        message: "Element not found for content extraction",
      });
      context.setOutput(nodeId, "");
    }
  }
}
