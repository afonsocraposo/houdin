import { BaseAction, ActionMetadata } from "@/types/actions";
import { copyToClipboard, getElement } from "@/utils/helpers";
import { NotificationService } from "@/services/notification";
import { selectProperty, textProperty } from "@/types/config-properties";

interface CopyContentActionConfig {
  selector: string;
  selectorType: "css" | "xpath" | "text";
}

interface CopyContentActionOutput {
  content: string; // The copied text content
}

export class CopyContentAction extends BaseAction<
  CopyContentActionConfig,
  CopyContentActionOutput
> {
  static readonly metadata: ActionMetadata = {
    type: "copy-content",
    label: "Copy Content",
    icon: "📋",
    description: "Copy text from page element",
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
        description: "Type of selector to use for content extraction",
        required: true,
      }),
      selector: textProperty({
        label: "Source Selector",
        placeholder: ".content, #description",
        description: "Element to copy content from",
        required: true,
      }),
    },
  };

  readonly outputExample = {
    content: "This text was copied from the element.",
  };

  async execute(
    config: CopyContentActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: CopyContentActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { selector, selectorType } = config;

    const sourceElement = getElement(selector, selectorType);
    if (sourceElement) {
      const textContent = sourceElement.textContent || "";
      const success = await copyToClipboard(textContent);
      if (!success) {
        onError(new Error("Failed to write to clipboard"));
        return;
      }
      onSuccess({ content: textContent });
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
