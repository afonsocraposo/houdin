import definition from "./copy-content.definition";
import TurndownService from "turndown";
import { BaseAction } from "@/types/actions";
import { copyToClipboard, getElement } from "@/utils/helpers";
import { NotificationService } from "@/services/notification";
interface CopyContentActionConfig {
  selector: string;
  selectorType: "css" | "xpath" | "text";
  format: "text" | "markdown" | "html";
}

interface CopyContentActionOutput {
  content: string; // The copied text content
}

export class CopyContentAction extends BaseAction<
  CopyContentActionConfig,
  CopyContentActionOutput
> {
  constructor() {
    super(definition);
  }

  async execute(
    config: CopyContentActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: CopyContentActionOutput) => void,
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
      const success = await copyToClipboard(content);
      if (!success) {
        onError(new Error("Failed to write to clipboard"));
        return;
      }
      onSuccess({ content: content });
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
