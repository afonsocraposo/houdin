import definition from "./inject-style.definition";
import { BaseAction } from "@/types/actions";
import { NotificationService } from "@/services/notification";
interface InjectStyleActionConfig {
  customStyle: string;
}

interface InjectStyleActionOutput {
  customStyle: string;
}

export class InjectStyleAction extends BaseAction<
  InjectStyleActionConfig,
  InjectStyleActionOutput
> {
  constructor() {
    super(definition);
  }

  async execute(
    config: InjectStyleActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { customStyle } = config;

    try {
      this.injectInlineStyle(customStyle);
    } catch (error: any) {
      onError(error as Error);
      NotificationService.showErrorNotification({
        message: "Error injecting custom style",
      });
    }
    onSuccess({
      customStyle,
    });
  }

  private injectInlineStyle(code: string) {
    const script = document.createElement("style");
    script.setAttribute("data-workflow-injected", "true");
    script.textContent = code;
    document.head.appendChild(script);
  }
}
