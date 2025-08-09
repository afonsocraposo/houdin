import { HttpListenerService } from "../services/httpListener";
import { StorageManager } from "../services/storage";

const runtime = (typeof browser !== "undefined" ? browser : chrome) as any;

interface HttpRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface HttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  data?: any;
  error?: string;
}

// Initialize HTTP listener service
let httpListener: HttpListenerService;

try {
  httpListener = HttpListenerService.getInstance(runtime);

  // Set up callback to handle HTTP triggers
  httpListener.setTriggerCallback((data, triggerNodeId, workflowId) => {
    // Find the tab that made the request
    runtime.tabs
      .sendMessage(data.request.tabId, {
        type: "HTTP_REQUEST_TRIGGER",
        data,
        triggerNodeId,
        workflowId,
      })
      .catch((error: any) => {
        console.error("Error sending HTTP trigger message:", error);
      });
  });

  // Pre-register HTTP triggers for active workflows
  initializeActiveHttpTriggers();
} catch (error) {
  console.error("Failed to initialize HttpListenerService:", error);
}

async function initializeActiveHttpTriggers(): Promise<void> {
  try {
    // Clear existing triggers first
    if (httpListener) {
      httpListener.clearAllTriggers();
    }

    const storageManager = StorageManager.getInstance();
    const workflows = await storageManager.getWorkflows();

    // Find all enabled workflows with HTTP triggers
    for (const workflow of workflows) {
      if (!workflow.enabled) continue;

      const httpTriggerNodes = workflow.nodes.filter(
        (node) =>
          node.type === "trigger" && node.data?.triggerType === "http-request",
      );

      for (const triggerNode of httpTriggerNodes) {
        const config = triggerNode.data?.config;
        if (config?.urlPattern) {
          httpListener.registerTrigger(
            workflow.id,
            triggerNode.id,
            config.urlPattern,
            config.method || "ANY",
          );
        }
      }
    }
  } catch (error) {
    console.error("Error initializing active HTTP triggers:", error);
  }
}

runtime.runtime.onMessage.addListener(
  (message: any, _sender: any, sendResponse: (response: any) => void) => {
    if (message.type === "HTTP_REQUEST") {
      handleHttpRequest(message.request as HttpRequest)
        .then((response) => sendResponse({ success: true, response }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        );
      return true; // Will respond asynchronously
    } else if (message.type === "REGISTER_HTTP_TRIGGER") {
      if (httpListener) {
        httpListener.registerTrigger(
          message.workflowId,
          message.triggerNodeId,
          message.urlPattern,
          message.method,
        );
      } else {
        console.error(
          "HttpListenerService not available for trigger registration",
        );
      }
    } else if (message.type === "UNREGISTER_HTTP_TRIGGER") {
      if (httpListener) {
        httpListener.unregisterTrigger(
          message.workflowId,
          message.triggerNodeId,
        );
      } else {
        console.error(
          "HttpListenerService not available for trigger unregistration",
        );
      }
    } else if (message.type === "SYNC_HTTP_TRIGGERS") {
      // Re-sync HTTP triggers for active workflows
      initializeActiveHttpTriggers();
    }
  },
);

async function handleHttpRequest(request: HttpRequest): Promise<HttpResponse> {
  try {
    const fetchOptions: RequestInit = {
      method: request.method || "GET",
      headers: request.headers || {},
    };

    if (
      request.body &&
      (request.method === "POST" ||
        request.method === "PUT" ||
        request.method === "PATCH")
    ) {
      fetchOptions.body = request.body;
    }

    const response = await fetch(request.url, fetchOptions);

    let data: any;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: "Network Error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

runtime.runtime.onInstalled.addListener(() => {
  console.debug("Extension installed");
});

// For manifest v2, use browserAction instead of action
if (runtime.browserAction) {
  runtime.browserAction.onClicked.addListener((_tab: any) => {
    // Extension icon clicked
  });
} else if (runtime.action) {
  runtime.action.onClicked.addListener((_tab: any) => {
    // Extension icon clicked
  });
}

// Handle navigation to changeme.config
runtime.tabs.onUpdated.addListener((tabId: number, changeInfo: any) => {
  if (changeInfo.url && changeInfo.url.includes("changeme.config")) {
    // Redirect to the config page
    const configUrl = runtime.runtime.getURL("src/config/index.html");
    runtime.tabs.update(tabId, { url: configUrl });
  }
});

// Alternative: Listen for navigation attempts
if (runtime.webNavigation) {
  runtime.webNavigation.onBeforeNavigate.addListener((details: any) => {
    if (details.url.includes("changeme.config")) {
      const configUrl = runtime.runtime.getURL("src/config/index.html");
      runtime.tabs.update(details.tabId, { url: configUrl });
    }
  });
}
