import definition from "./copy-content.definition";
import { BaseAction } from "@/types/actions";
import { copyToClipboard, getElement } from "@/utils/helpers";
import { NotificationService } from "@/services/notification";
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
