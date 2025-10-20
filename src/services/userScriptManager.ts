import { CustomMessage } from "@/lib/messages";
import { Runtime } from "webextension-polyfill";
import browser from "@/services/browser";

export interface UserScriptExecuteRequest {
  scriptCode: string;
  nodeId: string;
  tabId: number;
}

export interface UserScriptExecuteResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export interface WorkflowScriptMessage {
  type: "workflow-script-response";
  nodeId: string;
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
      const userScript = request.scriptCode;
      // Check if userScripts.execute is available (Chrome/Chromium-based browsers)
      if (
        typeof chrome !== "undefined" &&
        chrome.userScripts &&
        typeof chrome.userScripts.execute === "function"
      ) {
        return await this.executeWithUserScripts(userScript, request.tabId);
      } else {
        // Fallback for Firefox and other browsers
        return await this.executeWithFallback(
          userScript,
          request.tabId,
          request.nodeId,
        );
      }
    } catch (error) {
      console.debug("Failed to execute userScript:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async executeWithUserScripts(
    userScript: string,
    tabId: number,
  ): Promise<UserScriptExecuteResponse> {
    const wrappedScript = this.createWrappedScript(userScript);
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
      console.debug("UserScript execution results:", results);

      // Check if execution was successful
      if (results && results.length > 0) {
        const result = results[0].result;
        if (!result || !result?.success) {
          console.debug("UserScript execution error:", result?.error);
          return {
            success: false,
            error: result?.error,
          };
        }

        return {
          success: true,
          result: result.data,
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
    userScript: string,
    tabId: number,
    nodeId: string,
  ): Promise<UserScriptExecuteResponse> {
    return new Promise((resolve) => {
      const messageListener = (
        message: CustomMessage<WorkflowScriptMessage>,
        sender: Runtime.MessageSender,
      ) => {
        if (
          message.type === "workflow-script-response" &&
          message.data.nodeId === nodeId &&
          sender.tab?.id === tabId
        ) {
          browser.runtime.onMessage.removeListener(messageListener);
          const data = message.data;

          // Check if the error indicates a CSP violation
          if (data.error && data.error.includes("CSP_VIOLATION:")) {
            resolve({
              success: false,
              error: data.error,
            });
            return;
          }

          if (data.error) {
            resolve({
              success: false,
              error: data.error,
            });
          } else {
            resolve({
              success: true,
              result: data.result,
            });
          }
        }
      };

      browser.runtime.onMessage.addListener(messageListener);

      // Execute script using browser.scripting.executeScript (Manifest V3)
      if (
        browser.scripting &&
        typeof browser.scripting.executeScript === "function"
      ) {
        // Create and execute script directly
        const fallbackScript = this.createFallbackScript(userScript, nodeId);

        browser.scripting
          .executeScript({
            target: { tabId: tabId },
            world: "MAIN" as any,
            args: [fallbackScript, nodeId],
            func: (script: string, nodeId: string) => {
              try {
                // Add a small delay to ensure content script is ready
                setTimeout(() => {
                  try {
                    Function(script)();
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
                        } as WorkflowScriptMessage,
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
                        } as WorkflowScriptMessage,
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
                  } as WorkflowScriptMessage,
                  "*",
                );
              }
            },
          })
          .catch((error) => {
            browser.runtime.onMessage.removeListener(messageListener);
            resolve({
              success: false,
              error: `Script injection failed: ${error.message}`,
            });
          });
      } else {
        // If browser.scripting is not available, fall back to code injection
        browser.runtime.onMessage.removeListener(messageListener);
        resolve({
          success: false,
          error: "Script injection API not available in this browser",
        });
      }
    });
  }

  private createWrappedScript(userScript: string): string {
    return `
      (async function() {
        return await new Promise(resolve => {
            const Return = function(data) {
                resolve({ success: true, data: data });
            }
            ${userScript}
            // If no Return was called, resolve with success
            resolve({ success: true, data: null });
        }).catch(error => ({success: false, error: error.message || error.toString()}));
      })();
    `;
  }

  private createFallbackScript(userScript: string, nodeId: string): string {
    return `
    (async function() {
      const promiseResult = await new Promise(resolve => {
        const Return = function(data) {
          resolve({ success: true, data: data });
        };
        ${userScript}
        // If no Return was called, auto-resolve
        resolve({ success: true, data: null });
      }).catch(error => ({success: false, error: error.message || error.toString()}));

      // Send the result back to the background script
      window.postMessage({
        type: 'workflow-script-response',
        nodeId: '${nodeId}',
        result: promiseResult.success ? promiseResult.data : null,
        error: promiseResult.success ? undefined : promiseResult.error
      }, '*');

      return promiseResult;
    })();
  `;
  }
}
