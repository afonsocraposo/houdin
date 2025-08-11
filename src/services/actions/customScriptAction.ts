import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
  ActionExecutionContext,
} from "../../types/actions";

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
        customScript: {
          type: "code",
          label: "Custom JavaScript",
          placeholder:
            "// Access workflow context variables:\n// const prevResult = Get('nodeId'); // Get output from another node\n// const text = interpolate('Hello {{nodeId}}!'); // Interpolate variables\n\nalert('Hello World!');\nconsole.log('Custom script executed');\n\n// Use Return(data) to send data to next actions\n// Return({ message: 'Success' });",
          description:
            "JavaScript code to execute. Use Get(nodeId) to access variables from other nodes. Use Return(data) to send data to next actions.",
          language: "javascript",
          height: 200,
          required: true,
        },
      },
    };
  }

  async execute(
    config: CustomScriptActionConfig,
    context: ActionExecutionContext,
    nodeId: string,
  ): Promise<void> {
    const { customScript } = config;

    if (!customScript) {
      const error = new Error("No script provided");
      throw error;
    }

    try {
      // Create a promise that resolves when the script sends back data
      const result = await this.executeScriptWithOutput(
        customScript,
        nodeId,
        context,
      );

      // Store the output in the execution context
      context.setOutput(nodeId, result);
    } catch (error) {
      context.setOutput(nodeId, ""); // Store empty on error
      // Re-throw the error to stop workflow execution
      throw error;
    }
  }

  private async executeScriptWithOutput(
    scriptCode: string,
    nodeId: string,
    context: ActionExecutionContext,
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
        workflowId: context.workflowId,
      };

      // Send message to background script to register userScript
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
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (!response?.success) {
            clearTimeout(timeoutId);
            window.removeEventListener(
              "workflow-script-response",
              responseHandler as EventListener,
            );
            reject(
              new Error(response?.error || "Failed to register userScript"),
            );
            return;
          }

          console.debug(
            "UserScript executed successfully via background script",
          );

          // No cleanup needed for execute API - it's one-time execution
        },
      );
    });
  }
}
