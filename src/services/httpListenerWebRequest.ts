import browser from "@/services/browser";
import { matchesUrlPattern } from "@/utils/helpers";
import { WebRequest } from "webextension-polyfill";

interface HttpTrigger {
  tabId: number; // Tab ID for specific tab triggers
  workflowId: string;
  triggerNodeId: string;
  urlPattern: string;
  method: string;
  onTrigger: (data: any) => Promise<void>;
}

interface RequestData {
  url: string;
  method: string;
  headers: Record<string, string>;
  requestId: string;
  timestamp: number;
  tabId: number;
  type: string;
  frameId: number;
}

export class HttpListenerWebRequest {
  private static instance: HttpListenerWebRequest | null = null;
  private triggers: HttpTrigger[] = [];
  private isListening = false;
  private pendingRequests = new Map<string, RequestData>();

  private constructor() {
    this.onBeforeRequest = this.onBeforeRequest.bind(this);
    this.onHeadersReceived = this.onHeadersReceived.bind(this);
  }

  static getInstance(): HttpListenerWebRequest {
    if (!HttpListenerWebRequest.instance) {
      HttpListenerWebRequest.instance = new HttpListenerWebRequest();
    }
    return HttpListenerWebRequest.instance;
  }

  // Register a trigger with direct callback execution
  registerTrigger(
    tabId: number,
    workflowId: string,
    triggerNodeId: string,
    urlPattern: string,
    method: string,
    onTrigger: (data: any) => Promise<void>,
  ): void {
    // Remove existing trigger with same ID if it exists
    this.triggers = this.triggers.filter(
      (t) =>
        !(
          t.tabId == tabId &&
          t.workflowId === workflowId &&
          t.triggerNodeId === triggerNodeId
        ),
    );

    // Add new trigger
    this.triggers.push({
      tabId,
      workflowId,
      triggerNodeId,
      urlPattern,
      method,
      onTrigger,
    });
    console.debug("Registered triggers:", this.triggers);

    // Start listening if not already
    this.startListening();
  }

  // Unregister triggers for a specific tab
  unregisterTriggers(tabId: number): void {
    console.debug("Unregistering triggers for tab:", tabId);
    this.triggers = this.triggers.filter((t) => !(t.tabId === tabId));

    // Stop listening if no more triggers
    if (this.triggers.length === 0) {
      this.stopListening();
    }
  }

  private startListening(): void {
    if (this.isListening) return;

    this.isListening = true;

    browser.webRequest.onBeforeRequest.addListener(this.onBeforeRequest, {
      urls: ["<all_urls>"],
    });

    browser.webRequest.onHeadersReceived.addListener(
      this.onHeadersReceived,
      { urls: ["<all_urls>"] },
      ["responseHeaders"],
    );
  }

  private stopListening(): void {
    if (!this.isListening) return;
    this.isListening = false;

    browser.webRequest.onBeforeRequest.removeListener(this.onBeforeRequest);
    browser.webRequest.onHeadersReceived.removeListener(this.onHeadersReceived);
  }

  private onBeforeRequest = (
    details: WebRequest.OnBeforeRequestDetailsType,
  ) => {
    const requestData: RequestData = {
      url: details.url,
      method: details.method,
      headers: {}, // Headers not available in onBeforeRequest
      requestId: details.requestId,
      timestamp: details.timeStamp,
      tabId: details.tabId,
      type: details.type,
      frameId: details.frameId,
    };
    // Store request for later correlation with response
    this.pendingRequests.set(details.requestId, requestData);

    // Check triggers immediately for request
    this.checkTriggers(details.tabId, requestData);
  };

  private onHeadersReceived = (
    details: WebRequest.OnHeadersReceivedDetailsType,
  ) => {
    // Clean up request data after response is received
    setTimeout(() => {
      this.pendingRequests.delete(details.requestId);
    }, 5000);
  };

  private async checkTriggers(
    tabId: number,
    requestData: RequestData,
  ): Promise<void> {
    for (const trigger of this.triggers) {
      if (
        trigger.tabId === tabId &&
        this.matchesMethod(requestData.method, trigger.method) &&
        matchesUrlPattern(requestData.url, trigger.urlPattern)
      ) {
        try {
          // Execute workflow directly via callback
          await trigger.onTrigger({
            request: requestData,
          });
        } catch (error) {
          console.error(
            "HttpListenerWebRequest: Error executing trigger callback",
            error,
          );
        }
      }
    }
  }

  private matchesMethod(requestMethod: string, configMethod: string): boolean {
    return (
      configMethod === "ANY" ||
      requestMethod.toUpperCase() === configMethod.toUpperCase()
    );
  }

  destroy(): void {
    this.stopListening();
    this.triggers = [];
    this.pendingRequests.clear();
    HttpListenerWebRequest.instance = null;
  }
}
