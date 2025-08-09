import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
  ActionExecutionContext,
} from "../../types/actions";
import { getElement } from "../../utils/helpers";
import { NotificationService } from "../notification";

interface GetElementContentActionConfig {
  selector: string;
  selectorType: "css" | "xpath" | "text";
}

export class GetElementContentAction extends BaseAction<GetElementContentActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "get-element-content",
    label: "Get Element Content",
    icon: "📖",
    description: "Extract text content from page element",
    completion: true,
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
          description: "Type of selector to use for element extraction",
          required: true,
        },
        selector: {
          type: "text",
          label: "Selector",
          placeholder: ".title, #content, h1",
          description: "Selector for the element to extract content from",
          required: true,
          defaultValue: "h1",
        },
      },
    };
  }

  async execute(
    config: GetElementContentActionConfig,
    context: ActionExecutionContext,
    nodeId: string,
  ): Promise<void> {
    const { selector, selectorType } = config;

    const element = getElement(selector, selectorType);
    if (element) {
      const textContent = element.textContent || "";
      // Store the output in the execution context
      context.setOutput(nodeId, textContent);
    } else {
      console.error(`Element not found for selector: ${selector}`);
      NotificationService.showErrorNotification({
        message: "Element not found for content extraction",
      });
      context.setOutput(nodeId, "");
    }
  }
}
