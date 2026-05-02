import definition from "./http-request-trigger.definition";
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

export class HttpRequestTrigger extends BaseTrigger<
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
  ): Promise<void> {
    const { urlPattern, method } = config;
    if (!urlPattern)
      throw new Error("URL pattern is required for HTTP request trigger");
    sendMessageToBackground("REGISTER_HTTP_TRIGGER", {
      workflowId: workflowId || "",
      triggerNodeId: nodeId,
      urlPattern,
      method,
    });
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
  }
}
