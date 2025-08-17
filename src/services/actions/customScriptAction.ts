import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "../../types/actions";
import { UserScriptPermissionChecker } from "../userScriptPermissionChecker";
import PermissionButton from "../../components/PermissionButton";

// Custom Script Action Configuration
export interface CustomScriptActionConfig {
  customScript: string;
}

export class CustomScriptAction extends BaseAction<CustomScriptActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "custom-script",
    label: "Custom Script",
    icon: "⚡",
    description: "Execute custom JavaScript code",
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        permissionCheck: {
          type: "custom",
          label: "UserScript Permission",
          render: () => PermissionButton(),
        },
        customScript: {
          type: "code",
          label: "Custom JavaScript",
          placeholder:
            "// Access workflow context variables:\n// const prevResult = Get('nodeId'); // Get output from another node\n// const text = interpolate('Hello {{nodeId}}!'); // Interpolate variables\n\nalert('Hello World!');\nconsole.log('Custom script executed');\n\n// Use Return(data) to send data to next actions\n// Return({ message: 'Success' });",
          description:
            "JavaScript code to execute. Use Get('nodeId') to access variables from other nodes. Use Return(data) to send data to next actions.",
          language: "javascript",
          height: 200,
          required: true,
        },
      },
    };
  }

  async execute(
    config: CustomScriptActionConfig,
    _workflowId: string,
    nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { customScript } = config;

    if (!customScript) {
      const error = new Error("No script provided");
      onError(error);
      return;
    }

    try {
      // Check userScript permission status first
      const permissionStatus = await this.checkUserScriptPermission();
      console.debug("UserScript permission status:", permissionStatus);

      if (!permissionStatus.enabled && !permissionStatus.fallbackAvailable) {
        throw new Error(
          "UserScripts permission not available and no fallback method",
        );
      }

      if (!permissionStatus.enabled && permissionStatus.requiresToggle) {
        console.warn(
          "Permission instructions:",
          permissionStatus.toggleInstructions,
        );
      }

      // Create a promise that resolves when the script sends back data
      const result = await this.executeScriptWithOutput(
        customScript,
        nodeId,
        permissionStatus,
      );

      // Store the output in the execution context
      onSuccess(result);
    } catch (error: any) {
      onError(error); // Store empty on error
    }
  }

  private async checkUserScriptPermission() {
    const permissionChecker = UserScriptPermissionChecker.getInstance();
    return await permissionChecker.requestPermissionStatusFromBackground();
  }

  private async executeScriptWithOutput(
    scriptCode: string,
    nodeId: string,
    permissionStatus: any,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Script execution timeout"));
      }, 10000); // 10 second timeout

      // Listen for response from userscript
      const responseHandler = (event: CustomEvent) => {
        if (event.detail?.nodeId === nodeId) {
          clearTimeout(timeoutId);
          window.removeEventListener(
            "workflow-script-response",
            responseHandler as EventListener,
          );

          // Check if the script execution resulted in an error
          if (event.detail.error) {
            reject(new Error(event.detail.error));
          } else {
            resolve(event.detail.result);
          }
        }
      };

      window.addEventListener(
        "workflow-script-response",
        responseHandler as EventListener,
      );

      // Prepare context data for the script
      const contextData = {
        outputs: context.outputs,
        workflowId: context.workflowId || "",
      };

      // Determine execution method based on permission status
      if (permissionStatus.enabled) {
        // Use userScripts API via background script
        chrome.runtime.sendMessage(
          {
            type: "EXECUTE_USERSCRIPT",
            data: {
              scriptCode,
              nodeId,
              contextData,
            },
          },
          (response) => {
            if (chrome.runtime.lastError) {
              clearTimeout(timeoutId);
              window.removeEventListener(
                "workflow-script-response",
                responseHandler as EventListener,
              );
              reject(
                new Error(chrome.runtime.lastError.message || "Runtime error"),
              );
              return;
            }

            if (!response?.success) {
              clearTimeout(timeoutId);
              window.removeEventListener(
                "workflow-script-response",
                responseHandler as EventListener,
              );
              reject(
                new Error(response?.error || "Failed to execute userScript"),
              );
              return;
            }

            console.debug(
              "UserScript executed successfully via background script",
            );
          },
        );
      } else {
        clearTimeout(timeoutId);
        window.removeEventListener(
          "workflow-script-response",
          responseHandler as EventListener,
        );
        reject(new Error("No script execution method available"));
      }
    });
  }
}
