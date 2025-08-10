import {
  BaseTrigger,
  TriggerConfigSchema,
  TriggerExecutionContext,
  TriggerSetupResult,
} from "../../types/triggers";
import { HttpListenerServiceV3 } from "../httpListenerV3";

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

    // Get runtime for HTTP listener
    const runtime = (typeof browser !== "undefined" ? browser : chrome) as any;
    
    // Register directly with HTTP listener in content script
    const httpListener = HttpListenerServiceV3.getInstance(runtime);
    
    // Create callback that sets context and triggers workflow
    const triggerCallback = async (data: any) => {
      // Set the request/response data in context
      context.setOutput(context.triggerNode.id, data);
      
      // Trigger the workflow
      await onTrigger();
    };
    
    // Register trigger with direct callback
    httpListener.registerTrigger(
      context.workflowId || '',
      context.triggerNode.id,
      urlPattern,
      method,
      triggerCallback
    );

    console.debug("HTTP Request Trigger registered directly with listener", {
      workflowId: context.workflowId,
      triggerNodeId: context.triggerNode.id,
      urlPattern,
      method
    });

    return {
      cleanup: () => {
        // Unregister this trigger from HTTP listener
        httpListener.unregisterTrigger(context.workflowId || '', context.triggerNode.id);
        console.debug("HTTP Request Trigger unregistered", {
          workflowId: context.workflowId,
          triggerNodeId: context.triggerNode.id
        });
      },
    };
  }
}
