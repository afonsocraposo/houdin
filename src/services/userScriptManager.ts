export interface UserScriptExecuteRequest {
  scriptCode: string;
  nodeId: string;
  tabId: number;
  contextData: {
    outputs: Record<string, any>;
    workflowId: string;
  };
}

export interface UserScriptExecuteResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export class UserScriptManager {
  private static instance: UserScriptManager;

  static getInstance(): UserScriptManager {
    if (!UserScriptManager.instance) {
      UserScriptManager.instance = new UserScriptManager();
    }
    return UserScriptManager.instance;
  }

  async executeUserScript(
    request: UserScriptExecuteRequest,
  ): Promise<UserScriptExecuteResponse> {
    try {
      // Create the script code with workflow context
      const wrappedScript = this.createWrappedScript(
        request.scriptCode,
        request.nodeId,
        request.contextData,
      );

      // Execute the script using Chrome's userScripts API
      const results = await chrome.userScripts.execute({
        target: {
          tabId: request.tabId,
          allFrames: false, // Execute only in main frame
        },
        js: [
          {
            code: wrappedScript,
          },
        ],
        world: "MAIN",
        injectImmediately: true,
      });

      // Check if execution was successful
      if (results && results.length > 0) {
        const result = results[0];
        if (result.error) {
          console.error("UserScript execution error:", result.error);
          return {
            success: false,
            error: result.error,
          };
        }

        console.debug("UserScript executed successfully", result.result);
        return {
          success: true,
          result: result.result,
        };
      } else {
        return {
          success: false,
          error: "No execution results returned",
        };
      }
    } catch (error) {
      console.error("Failed to execute userScript:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private createWrappedScript(
    userScript: string,
    nodeId: string,
    contextData: { outputs: Record<string, any>; workflowId: string },
  ): string {
    return `
      (function() {
        try {
          // Inject workflow context into global scope
          window.WorkflowContext = ${JSON.stringify(contextData)};

          // Helper function to get output from another node
          window.Get = function(nodeId) {
            return window.WorkflowContext.outputs[nodeId];
          };

          // Helper function to interpolate variables like {{nodeId}}
          window.interpolate = function(text) {
            if (!text) return text;
            return text.replace(/\\{\\{([^}]+)\\}\\}/g, function(match, expression) {
              const parts = expression.trim().split('.');
              const nodeId = parts[0];
              const property = parts[1];

              const output = window.WorkflowContext.outputs[nodeId];
              if (output === undefined) return match;

              if (property && typeof output === 'object' && output !== null) {
                return String(output[property] || match);
              }

              return String(output);
            });
          };

          let resultReturned = false;

          // Helper function for scripts to send data back
          window.Return = function(data) {
            if (!resultReturned) {
              resultReturned = true;
              window.dispatchEvent(new CustomEvent('workflow-script-response', {
                detail: { nodeId: '${nodeId}', result: data }
              }));
            }
          };

          // Set up a timeout to auto-return undefined if Return() is not called
          setTimeout(() => {
            if (!resultReturned) {
              resultReturned = true;
              window.dispatchEvent(new CustomEvent('workflow-script-response', {
                detail: { nodeId: '${nodeId}', result: undefined }
              }));
            }
          }, 100);

          // Execute the user script
          ${userScript}

        } catch (error) {
          console.error('Custom script execution error:', error);
          window.dispatchEvent(new CustomEvent('workflow-script-response', {
            detail: { nodeId: '${nodeId}', result: null, error: error.message }
          }));
        }
      })();
    `;
  }
}
