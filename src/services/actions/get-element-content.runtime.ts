import definition from "./get-element-content.definition";
import { BaseAction } from "@/types/actions";
import { getElement } from "@/utils/helpers";
import { NotificationService } from "@/services/notification";
interface GetElementContentActionConfig {
  selector: string;
  selectorType: "css" | "xpath" | "text";
  getInnerHTML: boolean;
}

interface GetElementContentActionOutput {
  content: string; // The extracted text content
}

export class GetElementContentAction extends BaseAction<
  GetElementContentActionConfig,
  GetElementContentActionOutput
> {
  constructor() {
    super(definition);
  }

  async execute(
    config: GetElementContentActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { selector, selectorType, getInnerHTML } = config;

    const element = getElement(selector, selectorType);
    if (element) {
      const content = getInnerHTML ? element.innerHTML : (element.textContent || "");
      // Store the output in the execution context
      onSuccess({ content });
    } else {
      NotificationService.showErrorNotification({
        message: "Element not found for content extraction",
      });
      onError(new Error(`Element not found for selector: ${selector}`));
    }
  }
}
