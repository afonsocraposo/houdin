import definition from "./get-element-content.definition";
import TurndownService from "turndown";
import { BaseAction } from "@/types/actions";
import { getElement } from "@/utils/helpers";
import { NotificationService } from "@/services/notification";
interface GetElementContentActionConfig {
  selector: string;
  selectorType: "css" | "xpath" | "text";
  format: "text" | "markdown" | "html";
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
    const { selector, selectorType, format } = config;

    const element = getElement(selector, selectorType);
    if (element && element instanceof HTMLElement) {
      let content = "";
      switch (format) {
        case "markdown": {
          const turndownService = new TurndownService();
          content = turndownService.turndown(element.innerHTML || "");
          break;
        }
        case "html":
          content = element.innerHTML || "";
          break;
        default:
          content = element.innerText || "";
          break;
      }
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
