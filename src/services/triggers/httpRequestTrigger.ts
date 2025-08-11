import {
  BaseTrigger,
  TriggerConfigSchema,
  TriggerExecutionContext,
  TriggerSetupResult,
} from "../../types/triggers";

// HTTP Request Trigger Configuration
export interface HttpRequestTriggerConfig {
  urlPattern: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "ANY";
}

export class HttpRequestTrigger extends BaseTrigger<HttpRequestTriggerConfig> {
  readonly metadata = {
    type: "http-request",
    label: "HTTP Request",
    icon: "🌐",
    description:
      "Trigger when an HTTP request matches the specified URL pattern",
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

  async setup(
    config: HttpRequestTriggerConfig,
    context: TriggerExecutionContext,
    onTrigger: () => Promise<void>,
  ): Promise<TriggerSetupResult> {
    const { urlPattern, method } = config;

    if (!urlPattern) {
      throw new Error("URL pattern is required for HTTP request trigger");
    }

    // Send registration message to background script
    chrome.runtime.sendMessage({
      type: "REGISTER_HTTP_TRIGGER",
      workflowId: context.workflowId || "",
      triggerNodeId: context.triggerNode.id,
      urlPattern,
      method,
    });

    // Listen for trigger events from background script
    const messageListener = (message: any) => {
      if (
        message.type === "HTTP_TRIGGER_FIRED" &&
        message.workflowId === context.workflowId &&
        message.triggerNodeId === context.triggerNode.id
      ) {
        // Set the request data in context
        context.setOutput(context.triggerNode.id, message.data);
        // Trigger the workflow
        onTrigger();
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    console.debug("HTTP Request Trigger registered with background script", {
      workflowId: context.workflowId,
      triggerNodeId: context.triggerNode.id,
      urlPattern,
      method,
    });

    return {
      cleanup: () => {
        // Unregister from background script
        chrome.runtime.sendMessage({
          type: "UNREGISTER_HTTP_TRIGGER",
          workflowId: context.workflowId || "",
          triggerNodeId: context.triggerNode.id,
        });

        chrome.runtime.onMessage.removeListener(messageListener);

        console.debug("HTTP Request Trigger unregistered", {
          workflowId: context.workflowId,
          triggerNodeId: context.triggerNode.id,
        });
      },
    };
  }
}
