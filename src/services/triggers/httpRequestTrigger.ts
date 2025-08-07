import {
  BaseTrigger,
  TriggerConfigSchema,
  TriggerExecutionContext,
  TriggerSetupResult,
} from "../../types/triggers";

export class HttpRequestTrigger extends BaseTrigger {
  readonly metadata = {
    type: "http-request",
    label: "HTTP Request",
    icon: "🌐",
    description:
      "Trigger when an HTTP request matches the specified URL pattern (⚠️ only requests triggered after the page loads will be captured)",
  };

  getConfigSchema(): TriggerConfigSchema {
    return {
      properties: {
        urlPattern: {
          type: "text",
          label: "URL Pattern",
          placeholder: "https://api.example.com/users",
          description: "URL pattern to match (supports wildcards with *)",
          required: true,
        },
        method: {
          type: "select",
          label: "HTTP Method",
          options: [
            { value: "ANY", label: "Any Method" },
            { value: "GET", label: "GET" },
            { value: "POST", label: "POST" },
            { value: "PUT", label: "PUT" },
            { value: "DELETE", label: "DELETE" },
            { value: "PATCH", label: "PATCH" },
          ],
          defaultValue: "ANY",
          description: "HTTP method to match",
        },
      },
    };
  }

  getDefaultConfig(): Record<string, any> {
    return {
      urlPattern: "",
      method: "ANY",
    };
  }

  async setup(
    config: Record<string, any>,
    context: TriggerExecutionContext,
    onTrigger: () => Promise<void>,
  ): Promise<TriggerSetupResult> {
    const { urlPattern, method } = config;

    if (!urlPattern) {
      throw new Error("URL pattern is required for HTTP request trigger");
    }

    // Register this trigger with the background script
    chrome.runtime.sendMessage({
      type: "REGISTER_HTTP_TRIGGER",
      workflowId: context.workflowId,
      triggerNodeId: context.triggerNode.id,
      urlPattern,
      method,
    });

    // Listen for HTTP trigger messages from background script
    const messageListener = (message: any) => {
      if (
        message.type === "HTTP_REQUEST_TRIGGER" &&
        message.triggerNodeId === context.triggerNode.id &&
        message.workflowId === context.workflowId
      ) {
        // Set the request/response data in context
        context.setOutput(context.triggerNode.id, message.data);

        // Trigger the workflow
        onTrigger();
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return {
      cleanup: () => {
        // Unregister this trigger
        chrome.runtime.sendMessage({
          type: "UNREGISTER_HTTP_TRIGGER",
          workflowId: context.workflowId,
          triggerNodeId: context.triggerNode.id,
        });

        chrome.runtime.onMessage.removeListener(messageListener);
      },
    };
  }
}
