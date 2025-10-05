import { BaseAction, ActionMetadata } from "@/types/actions";
import { getElement } from "@/utils/helpers";
import { NotificationService } from "@/services/notification";
import { selectProperty, textProperty } from "@/types/config-properties";

interface GetElementContentActionConfig {
  selector: string;
  selectorType: "css" | "xpath" | "text";
}

interface GetElementContentActionOutput {
  content: string; // The extracted text content
}

export class GetElementContentAction extends BaseAction<
  GetElementContentActionConfig,
  GetElementContentActionOutput
> {
  static readonly metadata: ActionMetadata = {
    type: "get-element-content",
    label: "Get Element Content",
    icon: "📖",
    description: "Extract text content from page element",
  };

  configSchema = {
    properties: {
      selectorType: selectProperty({
        label: "Selector Type",
        options: [
          { label: "CSS Selector", value: "css" },
          { label: "XPath", value: "xpath" },
          { label: "Text", value: "text" },
        ],
        defaultValue: "css",
        description: "Type of selector to use for element extraction",
        required: true,
      }),
      selector: textProperty({
        label: "Selector",
        placeholder: ".title, #content, h1",
        description: "Selector for the element to extract content from",
        required: true,
        defaultValue: "h1",
      }),
    },
  };

  readonly outputExample = {
    content: "This text was extracted from the element.",
  };

  async execute(
    config: GetElementContentActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { selector, selectorType } = config;

    const element = getElement(selector, selectorType);
    if (element) {
      const textContent = element.textContent || "";
      // Store the output in the execution context
      onSuccess(textContent);
    } else {
      NotificationService.showErrorNotification({
        message: "Element not found for content extraction",
      });
      onError(new Error(`Element not found for selector: ${selector}`));
    }
  }
}
