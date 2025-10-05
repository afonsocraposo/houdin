import { BaseAction, ActionMetadata } from "@/types/actions";
import { NotificationService } from "@/services/notification";
import { codeProperty } from "@/types/config-properties";

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
  static readonly metadata: ActionMetadata = {
    type: "inject-style",
    label: "Inject Style",
    icon: "🎨",
    description: "Inject custom CSS styles",
  };

  readonly configSchema = {
    properties: {
      customStyle: codeProperty({
        label: "Custom CSS",
        placeholder:
          "body { background-color: lightblue; } .my-class { color: red; }",
        description: "CSS code to inject into the page.",
        language: "css",
        height: 200,
        required: true,
      }),
    },
  };

  readonly outputExample = {
    customStyle: "body { background-color: lightblue; }",
  };

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
