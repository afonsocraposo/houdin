import { BaseAction, ActionConfigSchema, ActionMetadata, ActionExecutionContext } from '../../types/actions';
import { NotificationService } from '../notification';

export class CustomScriptAction extends BaseAction {
  readonly metadata: ActionMetadata = {
    type: 'custom-script',
    label: 'Custom Script',
    icon: '⚡',
    description: 'Run custom JavaScript'
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        customScript: {
          type: 'code',
          label: 'Custom JavaScript',
          placeholder: 'alert(\'Hello World!\'); console.log(\'Custom script executed\');',
          description: 'JavaScript code to execute. Use Return(data) to send data to next actions.',
          language: 'javascript',
          height: 200,
          required: true
        }
      }
    };
  }

  getDefaultConfig(): Record<string, any> {
    return {
      customScript: ''
    };
  }

  async execute(
    config: Record<string, any>,
    context: ActionExecutionContext,
    nodeId: string
  ): Promise<void> {
    const { customScript } = config;
    
    if (!customScript) {
      NotificationService.showErrorNotification({
        message: 'No script provided',
      });
      return;
    }

    try {
      // Create a promise that resolves when the script sends back data
      const result = await this.executeScriptWithOutput(customScript, nodeId);

      // Store the output in the execution context
      context.setOutput(nodeId, result);
    } catch (error) {
      console.error('Error executing custom script:', error);
      NotificationService.showErrorNotification({
        message: 'Error executing custom script',
      });
      context.setOutput(nodeId, ''); // Store empty on error
    }
  }

  private executeScriptWithOutput(scriptCode: string, nodeId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Script execution timeout'));
      }, 10000); // 10 second timeout

      // Listen for response from injected script
      const responseHandler = (event: CustomEvent) => {
        if (event.detail?.nodeId === nodeId) {
          clearTimeout(timeoutId);
          window.removeEventListener(
            'workflow-script-response',
            responseHandler as EventListener,
          );
          resolve(event.detail.result);
        }
      };

      window.addEventListener(
        'workflow-script-response',
        responseHandler as EventListener,
      );

      // Inject script that includes response mechanism
      const wrappedScript = `
            (function() {
                try {
                    // Your custom script code here
                    ${scriptCode}

                    // If script doesn't manually send response, send undefined
                    // Scripts can override this by calling Return() themselves
                    if (typeof Return !== 'function') {
                        window.dispatchEvent(new CustomEvent('workflow-script-response', {
                            detail: { nodeId: '${nodeId}', result: undefined }
                        }));
                    }
                } catch (error) {
                    window.dispatchEvent(new CustomEvent('workflow-script-response', {
                        detail: { nodeId: '${nodeId}', result: null, error: error.message }
                    }));
                }
            })();

            // Helper function for scripts to send data back
            function Return(data) {
                window.dispatchEvent(new CustomEvent('workflow-script-response', {
                    detail: { nodeId: '${nodeId}', result: data }
                }));
            }
        `;

      this.injectInlineScript(wrappedScript);
    });
  }

  private injectInlineScript(code: string) {
    // Use blob URL to avoid CSP violations with inline scripts
    const blob = new Blob([code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      URL.revokeObjectURL(url); // Clean up blob URL
      script.remove(); // Clean up script element
    };
    script.onerror = () => {
      URL.revokeObjectURL(url); // Clean up blob URL on error
      script.remove(); // Clean up script element
    };
    
    document.head.appendChild(script);
  }
}