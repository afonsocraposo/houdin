import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "../../types/actions";
import { copyToClipboard, getElement } from "../../utils/helpers";
import { NotificationService } from "../notification";

interface CopyContentActionConfig {
  selector: string;
  selectorType: "css" | "xpath" | "text";
}

export class CopyContentAction extends BaseAction<CopyContentActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "copy-content",
    label: "Copy Content",
    icon: "📋",
    description: "Copy text from page element",
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
          description: "Type of selector to use for content extraction",
          required: true,
        },
        selector: {
          type: "text",
          label: "Source Selector",
          placeholder: ".content, #description",
          description: "Element to copy content from",
          required: true,
        },
      },
    };
  }

  async execute(
    config: CopyContentActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { selector, selectorType } = config;

    const sourceElement = getElement(selector, selectorType);
    if (sourceElement) {
      const textContent = sourceElement.textContent || "";
      await copyToClipboard(textContent);
      onSuccess(textContent);
      NotificationService.showNotification({
        title: "Content copied to clipboard!",
      });
    } else {
      onError(new Error("Source element not found"));
      NotificationService.showErrorNotification({
        message: "Source element not found",
      });
    }
  }
}
