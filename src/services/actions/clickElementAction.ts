import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
  ActionExecutionContext,
} from "../../types/actions";
import { getElement } from "../../utils/helpers";
import { NotificationService } from "../notification";

interface ClickElementActionConfig {
  elementSelector: string;
  selectorType: "css" | "xpath" | "text";
}

export class ClickElementAction extends BaseAction<ClickElementActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "click-element",
    label: "Click Element",
    icon: "🖱️",
    description: "Click on a page element",
  };

  getConfigSchema(): ActionConfigSchema {
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
        elementSelector: {
          type: "text",
          label: "Element Selector",
          placeholder: ".title, #content, h1",
          description: "Selector for the element to click",
          required: true,
          defaultValue: "button",
        },
      },
    };
  }

  async execute(
    config: ClickElementActionConfig,
    context: ActionExecutionContext,
    nodeId: string,
  ): Promise<void> {
    const { elementSelector, selectorType } = config;

    const element = getElement(elementSelector, selectorType);
    if (element) {
      // Simulate a click on the element
      element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      context.setOutput(nodeId, element.outerHTML);
    } else {
      NotificationService.showErrorNotification({
        message: "Element not found for clicking",
      });
      context.setOutput(nodeId, "");
    }
  }
}
