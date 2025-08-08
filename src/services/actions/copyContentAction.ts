import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
  ActionExecutionContext,
} from "../../types/actions";
import { copyToClipboard } from "../../utils/helpers";
import { NotificationService } from "../notification";

interface CopyContentActionConfig {
  sourceSelector: string;
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
        sourceSelector: {
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
    _context: ActionExecutionContext,
    _nodeId: string,
  ): Promise<void> {
    const { sourceSelector } = config;

    const sourceElement = document.querySelector(sourceSelector);
    if (sourceElement) {
      const textContent = sourceElement.textContent || "";
      await copyToClipboard(textContent);
      NotificationService.showNotification({
        title: "Content copied to clipboard!",
      });
    } else {
      NotificationService.showErrorNotification({
        message: "Source element not found",
      });
    }
  }
}
