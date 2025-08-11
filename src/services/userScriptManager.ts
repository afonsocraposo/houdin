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

      // Check if userScripts.execute is available (Chrome/Chromium-based browsers)
      if (chrome.userScripts && typeof chrome.userScripts.execute === 'function') {
        return await this.executeWithUserScripts(wrappedScript, request.tabId);
      } else {
        // Fallback for Firefox and other browsers
        return await this.executeWithFallback(wrappedScript, request.tabId, request.nodeId);
      }
    } catch (error) {
      console.error("Failed to execute userScript:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async executeWithUserScripts(
    wrappedScript: string,
    tabId: number,
  ): Promise<UserScriptExecuteResponse> {
    try {
      const results = await chrome.userScripts.execute({
        target: {
          tabId: tabId,
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
      console.error("UserScripts.execute failed:", error);
      throw error;
    }
  }

  private async executeWithFallback(
    wrappedScript: string,
    tabId: number,
    nodeId: string,
  ): Promise<UserScriptExecuteResponse> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        chrome.runtime.onMessage.removeListener(messageListener);
        resolve({
          success: false,
          error: "Script execution timeout",
        });
      }, 5000); // 5 second timeout

      const messageListener = (message: any, sender: chrome.runtime.MessageSender) => {
        if (
          message.type === "workflow-script-response" &&
          message.nodeId === nodeId &&
          sender.tab?.id === tabId
        ) {
          clearTimeout(timeoutId);
          chrome.runtime.onMessage.removeListener(messageListener);
          
          if (message.error) {
            resolve({
              success: false,
              error: message.error,
            });
          } else {
            resolve({
              success: true,
              result: message.result,
            });
          }
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);

      // Create script that communicates via window.postMessage to content script
      const fallbackScript = this.createFallbackScript(wrappedScript, nodeId);

      // Execute script using chrome.scripting.executeScript (Manifest V3)
      if (chrome.scripting && chrome.scripting.executeScript) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          world: "MAIN",
          args: [fallbackScript],
          func: (script: string) => {
            eval(script);
          },
        }).catch((error) => {
          clearTimeout(timeoutId);
          chrome.runtime.onMessage.removeListener(messageListener);
          resolve({
            success: false,
            error: `Script injection failed: ${error.message}`,
          });
        });
      } else {
        // If chrome.scripting is not available, fall back to code injection
        clearTimeout(timeoutId);
        chrome.runtime.onMessage.removeListener(messageListener);
        resolve({
          success: false,
          error: "Script injection API not available in this browser",
        });
      }
    });
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

  private createFallbackScript(wrappedScript: string, nodeId: string): string {
    return `
      (function() {
        try {
          // Inject workflow context into global scope
          window.WorkflowContext = ${JSON.stringify(this.getContextDataFromScript(wrappedScript))};

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

          // Helper function for scripts to send data back using window.postMessage
          window.Return = function(data) {
            if (!resultReturned) {
              resultReturned = true;
              window.postMessage({
                type: 'workflow-script-response',
                nodeId: '${nodeId}',
                result: data
              }, '*');
            }
          };

          // Set up a timeout to auto-return undefined if Return() is not called
          setTimeout(() => {
            if (!resultReturned) {
              resultReturned = true;
              window.postMessage({
                type: 'workflow-script-response',
                nodeId: '${nodeId}',
                result: undefined
              }, '*');
            }
          }, 100);

          // Execute the user script
          ${this.extractUserScriptFromWrapped(wrappedScript)}

        } catch (error) {
          console.error('Custom script execution error:', error);
          window.postMessage({
            type: 'workflow-script-response',
            nodeId: '${nodeId}',
            result: null,
            error: error.message
          }, '*');
        }
      })();
    `;
  }

  private getContextDataFromScript(wrappedScript: string): any {
    // Extract context data from the wrapped script
    const match = wrappedScript.match(/window\.WorkflowContext = ({.*?});/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        return { outputs: {}, workflowId: '' };
      }
    }
    return { outputs: {}, workflowId: '' };
  }

  private extractUserScriptFromWrapped(wrappedScript: string): string {
    // Extract the user script from the wrapped script
    const lines = wrappedScript.split('\n');
    let extracting = false;
    let userScript = '';
    
    for (const line of lines) {
      if (line.trim().includes('// Execute the user script')) {
        extracting = true;
        continue;
      }
      if (extracting && line.trim().includes('} catch (error)')) {
        break;
      }
      if (extracting) {
        userScript += line + '\n';
      }
    }
    
    return userScript.trim();
  }
}
