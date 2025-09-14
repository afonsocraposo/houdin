import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "@/types/actions";
import { NotificationService } from "@/services/notification";

interface InjectStyleActionConfig {
  customScript: string;
}

export class InjectStyleAction extends BaseAction<InjectStyleActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "inject-style",
    label: "Inject Style",
    icon: "🎨",
    description: "Inject custom CSS styles",
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        customScript: {
          type: "code",
          label: "Custom CSS",
          placeholder:
            "body { background-color: lightblue; } .my-class { color: red; }",
          description: "CSS code to inject into the page.",
          language: "css",
          height: 200,
          required: true,
        },
      },
    };
  }

  async execute(
    config: InjectStyleActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { customScript } = config;

    try {
      this.injectInlineStyle(customScript);
    } catch (error: any) {
      onError(error as Error);
      NotificationService.showErrorNotification({
        message: "Error injecting custom style",
      });
    }
    onSuccess({
      message: "Custom style injected successfully",
    });
  }

  private injectInlineStyle(code: string) {
    const script = document.createElement("style");
    script.setAttribute("data-workflow-injected", "true");
    script.textContent = code;
    document.head.appendChild(script);
  }
}
