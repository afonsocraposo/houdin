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
      if (
        chrome.userScripts &&
        typeof chrome.userScripts.execute === "function"
      ) {
        return await this.executeWithUserScripts(wrappedScript, request.tabId);
      } else {
        // Fallback for Firefox and other browsers
        return await this.executeWithFallback(
          wrappedScript,
          request.tabId,
          request.nodeId,
        );
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

      const messageListener = (
        message: any,
        sender: chrome.runtime.MessageSender,
      ) => {
        if (
          message.type === "workflow-script-response" &&
          message.nodeId === nodeId &&
          sender.tab?.id === tabId
        ) {
          clearTimeout(timeoutId);
          chrome.runtime.onMessage.removeListener(messageListener);

          // Check if the error indicates a CSP violation
          if (message.error && message.error.includes("CSP_VIOLATION:")) {
            // Show CSP notification by injecting it into the page
            chrome.scripting
              .executeScript({
                target: { tabId: tabId },
                world: "ISOLATED",
                func: () => {
                  const notificationEvent = new CustomEvent(
                    "notificationDispatch",
                    {
                      detail: {
                        title: "CSP Restriction",
                        message:
                          "Script execution blocked by Content Security Policy. Running in restricted mode with limited page access.",
                        color: "orange",
                        autoClose: 3000,
                      },
                    },
                  );
                  window.dispatchEvent(notificationEvent);
                },
              })
              .catch(() => {}); // Ignore notification errors

            // Create isolated world script and execute it
            const isolatedScript = this.createIsolatedWorldScript(
              wrappedScript,
              nodeId,
            );

            // Set up new message listener for isolated world execution
            const isolatedMessageListener = (
              isolatedMessage: any,
              isolatedSender: chrome.runtime.MessageSender,
            ) => {
              if (
                isolatedMessage.type === "workflow-script-response" &&
                isolatedMessage.nodeId === nodeId &&
                isolatedSender.tab?.id === tabId
              ) {
                chrome.runtime.onMessage.removeListener(
                  isolatedMessageListener,
                );
                resolve({
                  success: true,
                  result: isolatedMessage.result,
                });
              }
            };
            chrome.runtime.onMessage.addListener(isolatedMessageListener);

            console.log(
              "Executing script in ISOLATED world due to CSP violation",
            );
            // Execute in ISOLATED world
            chrome.scripting
              .executeScript({
                target: { tabId: tabId },
                world: "ISOLATED",
                args: [isolatedScript],
                func: (script: string) => {
                  eval(script);
                },
              })
              .catch((isolatedError) => {
                chrome.runtime.onMessage.removeListener(
                  isolatedMessageListener,
                );
                resolve({
                  success: false,
                  error: `Script injection failed in ISOLATED world: ${isolatedError.message}`,
                });
              });
            return;
          }

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

      // Execute script using chrome.scripting.executeScript (Manifest V3)
      if (
        chrome.scripting &&
        typeof chrome.scripting.executeScript === "function"
      ) {
        // Create and execute script directly
        const fallbackScript = this.createFallbackScript(wrappedScript, nodeId);

        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            world: "MAIN",
            args: [fallbackScript, nodeId],
            func: (script: string, nodeId: string) => {
              try {
                // Add a small delay to ensure content script is ready
                setTimeout(() => {
                  try {
                    eval(script);
                  } catch (evalError) {
                    console.error("Script eval error:", evalError);
                    // Check if this is a CSP error
                    const errorMessage = String(
                      evalError &&
                        typeof evalError === "object" &&
                        "message" in evalError
                        ? evalError.message
                        : evalError?.toString() || "Unknown eval error",
                    );
                    if (
                      errorMessage.includes("Content-Security-Policy") ||
                      errorMessage.includes("unsafe-eval") ||
                      errorMessage.includes("script-src") ||
                      errorMessage.includes("CSP")
                    ) {
                      // This is a CSP violation - send special error via postMessage
                      window.postMessage(
                        {
                          type: "workflow-script-response",
                          nodeId: nodeId,
                          result: null,
                          error: "CSP_VIOLATION: " + errorMessage,
                        },
                        "*",
                      );
                    } else {
                      // Regular error
                      window.postMessage(
                        {
                          type: "workflow-script-response",
                          nodeId: nodeId,
                          result: null,
                          error: errorMessage || "Unknown eval error",
                        },
                        "*",
                      );
                    }
                  }
                }, 10);
              } catch (outerError) {
                console.error("Outer script error:", outerError);
                const errorMsg =
                  outerError &&
                  typeof outerError === "object" &&
                  "message" in outerError
                    ? outerError.message
                    : outerError?.toString() || "Unknown error";
                window.postMessage(
                  {
                    type: "workflow-script-response",
                    nodeId: nodeId,
                    result: null,
                    error: "Script injection error: " + errorMsg,
                  },
                  "*",
                );
              }
            },
          })
          .catch((error) => {
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

  private createIsolatedWorldScript(
    wrappedScript: string,
    nodeId: string,
  ): string {
    // Extract user script and context from wrapped script
    const contextData = this.getContextDataFromScript(wrappedScript);
    const userScript = this.extractUserScriptFromWrapped(wrappedScript);

    return `
      (function() {
        try {
          // Note: In ISOLATED world, we have limited access to page DOM and variables
          // but we have access to chrome extension APIs

          // Simulate workflow context (limited in ISOLATED world)
          const WorkflowContext = ${JSON.stringify(contextData)};

          // Helper function to get output from another node (limited functionality)
          const Get = function(nodeId) {
            return WorkflowContext.outputs[nodeId];
          };

          // Helper function to interpolate variables (limited functionality)
          const interpolate = function(text) {
            if (!text) return text;
            return text.replace(/\\{\\{([^}]+)\\}\\}/g, function(match, expression) {
              const parts = expression.trim().split('.');
              const nodeId = parts[0];
              const property = parts[1];

              const output = WorkflowContext.outputs[nodeId];
              if (output === undefined) return match;

              if (property && typeof output === 'object' && output !== null) {
                return String(output[property] || match);
              }

              return String(output);
            });
          };

          let resultReturned = false;

          // Helper function for scripts to send data back using chrome.runtime.sendMessage
          const Return = function(data) {
            if (!resultReturned) {
              resultReturned = true;
              chrome.runtime.sendMessage({
                type: 'workflow-script-response',
                nodeId: '${nodeId}',
                result: data
              });
            }
          };

          // Set up a timeout to auto-return undefined if Return() is not called
          setTimeout(() => {
            if (!resultReturned) {
              resultReturned = true;
              chrome.runtime.sendMessage({
                type: 'workflow-script-response',
                nodeId: '${nodeId}',
                result: undefined
              });
            }
          }, 100);

          // Execute the user script with limited context
          // Note: Some page-specific functionality may not work in ISOLATED world
          ${userScript}

        } catch (error) {
          console.error('Custom script execution error (ISOLATED world):', error);
          chrome.runtime.sendMessage({
            type: 'workflow-script-response',
            nodeId: '${nodeId}',
            result: null,
            error: error.message + ' (Limited functionality in CSP-restricted mode)'
          });
        }
      })();
    `;
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
          try {
            ${this.extractUserScriptFromWrapped(wrappedScript)}
          } catch (evalError) {
            // Check if this is a CSP error
            const errorMessage = evalError?.message || evalError?.toString() || '';
            if (errorMessage.includes('Content-Security-Policy') ||
                errorMessage.includes('unsafe-eval') ||
                errorMessage.includes('script-src') ||
                errorMessage.includes('CSP')) {
              // This is a CSP violation - send special error
              window.postMessage({
                type: 'workflow-script-response',
                nodeId: '${nodeId}',
                result: null,
                error: 'CSP_VIOLATION: ' + errorMessage
              }, '*');
              return; // Stop execution here
            }
            // Regular error - re-throw to be caught by outer catch
            throw evalError;
          }

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
        return { outputs: {}, workflowId: "" };
      }
    }
    return { outputs: {}, workflowId: "" };
  }

  private extractUserScriptFromWrapped(wrappedScript: string): string {
    // Extract the user script from the wrapped script
    const lines = wrappedScript.split("\n");
    let extracting = false;
    let userScript = "";

    for (const line of lines) {
      if (line.trim().includes("// Execute the user script")) {
        extracting = true;
        continue;
      }
      if (extracting && line.trim().includes("} catch (error)")) {
        break;
      }
      if (extracting) {
        userScript += line + "\n";
      }
    }

    return userScript.trim();
  }
}
