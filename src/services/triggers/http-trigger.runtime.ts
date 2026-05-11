import definition from "./http-trigger.definition";
import { BaseTrigger } from "@/types/triggers";
import { sendMessageToBackground, CustomMessage } from "@/lib/messages";
import { HttpTriggerFiredMessage } from "@/types/background-workflow";
import browser from "@/services/browser";

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

export default class HttpTrigger extends BaseTrigger<
  HttpRequestTriggerConfig,
  HttpRequestTriggerOutput
> {
  constructor() {
    super(definition);
  }

  async setup(
    config: HttpRequestTriggerConfig,
    workflowId: string,
    nodeId: string,
    onTrigger: (data: HttpRequestTriggerOutput) => Promise<void>,
  ): Promise<() => void> {
    const { urlPattern, method } = config;
    if (!urlPattern)
      throw new Error("URL pattern is required for HTTP request trigger");
    const response = await sendMessageToBackground("REGISTER_HTTP_TRIGGER", {
      workflowId: workflowId || "",
      triggerNodeId: nodeId,
      urlPattern,
      method,
    });

    if (!response?.success) {
      throw new Error(response?.error || "Failed to register HTTP trigger");
    }

    const messageListener = (
      message: CustomMessage<HttpTriggerFiredMessage>,
    ) => {
      if (
        message.type === "HTTP_TRIGGER_FIRED" &&
        message.data.workflowId === workflowId &&
        message.data.triggerNodeId === nodeId
      )
        onTrigger(message.data.data.request);
      return;
    };
    browser.runtime.onMessage.addListener(messageListener);
    console.debug("HTTP Request Trigger registered with background script", {
      workflowId,
      triggerNodeId: nodeId,
      urlPattern,
      method,
    });
    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
      sendMessageToBackground("UNREGISTER_HTTP_TRIGGER", {
        workflowId,
        triggerNodeId: nodeId,
      });
    };
  }
}
