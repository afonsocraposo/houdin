import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
  ActionExecutionContext,
} from "../../types/actions";
import { NotificationService } from "../notification";

export class InjectStyleAction extends BaseAction {
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

  getDefaultConfig(): Record<string, any> {
    return {
      customScript: "",
    };
  }

  async execute(
    config: Record<string, any>,
    _context: ActionExecutionContext,
    _nodeId: string,
  ): Promise<void> {
    const { customScript } = config;

    try {
      this.injectInlineStyle(customScript);
    } catch (error) {
      console.error("Error injecting custom style:", error);
      NotificationService.showErrorNotification({
        message: "Error injecting custom style",
      });
    }
  }

  private injectInlineStyle(code: string) {
    const script = document.createElement("style");
    script.textContent = code;
    document.head.appendChild(script);
  }
}
