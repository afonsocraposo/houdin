import definition from "./custom-script.definition";
import { BaseAction } from "@/types/actions";
import {
  UserScriptPermissionChecker,
  UserScriptPermissionStatus,
} from "@/services/userScriptPermissionChecker";
import {
  UserScriptExecuteResponse,
  UserScriptManager,
} from "@/services/userScriptManager";

// Custom Script Action Configuration
export interface CustomScriptActionConfig {
  customScript: string;
}

interface CustomScriptActionOutput {
  [key: string]: any; // Flexible output structure
}

export class CustomScriptAction extends BaseAction<
  CustomScriptActionConfig,
  CustomScriptActionOutput
> {
  constructor() {
    super(definition);
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

      if (
        !permissionStatus.enabled &&
        permissionStatus.available &&
        permissionStatus.requiresToggle
      ) {
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
