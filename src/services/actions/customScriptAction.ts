import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "../../types/actions";
import {
  UserScriptPermissionChecker,
  UserScriptPermissionStatus,
} from "../userScriptPermissionChecker";
import PermissionButton from "../../components/PermissionButton";
import {
  UserScriptExecuteResponse,
  UserScriptManager,
} from "../userScriptManager";

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
    tabId: number,
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
        tabId,
        nodeId,
      );
      if (result.success) {
        // Store the output in the execution context
        onSuccess(result.result);
      } else {
        // Handle script execution failure
        const error = new Error(
          `Script execution failed: ${result.error || "Unknown error"}`,
        );
        onError(error);
      }
    } catch (error: any) {
      onError(error); // Store empty on error
    }
  }

  private async checkUserScriptPermission(): Promise<UserScriptPermissionStatus> {
    const permissionChecker = UserScriptPermissionChecker.getInstance();
    return await permissionChecker.checkPermissionStatus();
  }

  private async executeScriptWithOutput(
    scriptCode: string,
    tabId: number,
    nodeId: string,
  ): Promise<UserScriptExecuteResponse> {
    const userScriptManager = UserScriptManager.getInstance();
    return await userScriptManager.executeUserScript({
      scriptCode,
      tabId,
      nodeId,
    });
  }
}
