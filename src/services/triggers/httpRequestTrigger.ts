import { BaseTrigger } from "@/types/triggers";
import { textProperty, selectProperty } from "@/types/config-properties";
import { sendMessageToBackground, CustomMessage } from "@/lib/messages";
import { HttpTriggerFiredMessage } from "@/types/background-workflow";
import { IconApi } from "@tabler/icons-react";
import browser from "@/services/browser";

// HTTP Request Trigger Configuration
export interface HttpRequestTriggerConfig {
  urlPattern: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "ANY";
}

interface HttpRequestTriggerOutput {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

export class HttpRequestTrigger extends BaseTrigger<
  HttpRequestTriggerConfig,
  HttpRequestTriggerOutput
> {
  static readonly metadata = {
    type: "http-request",
    label: "HTTP Request",
    icon: IconApi,
    description:
      "Trigger when an HTTP request matches the specified URL pattern",
  };

  static readonly configSchema = {
    properties: {
      urlPattern: textProperty({
        label: "URL Pattern",
        placeholder: "https://api.example.com/users",
        description: "URL pattern to match (supports wildcards with *)",
        required: true,
      }),
      method: selectProperty({
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
      }),
    },
  };

  readonly outputExample = {
    url: "https://api.example.com/users",
    method: "GET",
    headers: { "content-type": "application/json" },
    body: { name: "John Doe" },
  };

  async setup(
    config: HttpRequestTriggerConfig,
    workflowId: string,
    nodeId: string,
    onTrigger: (data: HttpRequestTriggerOutput) => Promise<void>,
  ): Promise<void> {
    const { urlPattern, method } = config;

    if (!urlPattern) {
      throw new Error("URL pattern is required for HTTP request trigger");
    }

    sendMessageToBackground("REGISTER_HTTP_TRIGGER", {
      workflowId: workflowId || "",
      triggerNodeId: nodeId,
      urlPattern,
      method,
    });

    // Listen for trigger events from background script
    const messageListener = (
      message: CustomMessage<HttpTriggerFiredMessage>,
    ) => {
      if (
        message.type === "HTTP_TRIGGER_FIRED" &&
        message.data.workflowId === workflowId &&
        message.data.triggerNodeId === nodeId
      ) {
        // Set the request data in context
        // context.setOutput(context.triggerNode.id, message.data);
        // Trigger the workflow
        onTrigger(message.data.data.request);
      }
      return;
    };

    browser.runtime.onMessage.addListener(messageListener);

    console.debug("HTTP Request Trigger registered with background script", {
      workflowId,
      triggerNodeId: nodeId,
      urlPattern,
      method,
    });
  }
}
