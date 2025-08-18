// Manifest V3 compatible HTTP trigger system using chrome.webRequest API

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

    // Try direct chrome API access first
    if (chrome?.webRequest?.onBeforeRequest) {
      this.isListening = true;

      chrome.webRequest.onBeforeRequest.addListener(this.onBeforeRequest, {
        urls: ["<all_urls>"],
      });

      chrome.webRequest.onHeadersReceived.addListener(
        this.onHeadersReceived,
        { urls: ["<all_urls>"] },
        ["responseHeaders"],
      );
      return;
    }

    // Fallback to runtime detection
    const runtime = (typeof browser !== "undefined" ? browser : chrome) as any;
    if (!runtime?.webRequest?.onBeforeRequest) {
      console.error(
        "HttpListenerWebRequest: chrome.webRequest API not available. Make sure 'webRequest' permission is declared in manifest.json",
      );
      console.error(
        "HttpListenerWebRequest: Available APIs:",
        Object.keys(chrome || {}),
      );
      return;
    }

    this.isListening = true;

    // Listen for all requests
    runtime.webRequest.onBeforeRequest.addListener(this.onBeforeRequest, {
      urls: ["<all_urls>"],
    });

    // Listen for responses
    runtime.webRequest.onHeadersReceived.addListener(
      this.onHeadersReceived,
      { urls: ["<all_urls>"] },
      ["responseHeaders"],
    );
  }

  private stopListening(): void {
    if (!this.isListening) return;
    this.isListening = false;

    // Try direct chrome API first
    if (chrome?.webRequest?.onBeforeRequest) {
      chrome.webRequest.onBeforeRequest.removeListener(this.onBeforeRequest);
      chrome.webRequest.onHeadersReceived.removeListener(
        this.onHeadersReceived,
      );
      return;
    }

    // Fallback to runtime detection
    const runtime = (typeof browser !== "undefined" ? browser : chrome) as any;
    if (runtime?.webRequest?.onBeforeRequest) {
      runtime.webRequest.onBeforeRequest.removeListener(this.onBeforeRequest);
      runtime.webRequest.onHeadersReceived.removeListener(
        this.onHeadersReceived,
      );
    }
  }

  private onBeforeRequest = (
    details: chrome.webRequest.WebRequestBodyDetails,
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
    details: chrome.webRequest.WebResponseHeadersDetails,
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
        this.matchesPattern(requestData.url, trigger.urlPattern) &&
        this.matchesMethod(requestData.method, trigger.method)
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

  private matchesPattern(url: string, pattern: string): boolean {
    try {
      const regexPattern = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\\\*/g, ".*");

      const regex = new RegExp(`^${regexPattern}$`, "i");
      return regex.test(url);
    } catch (error) {
      console.error("Invalid URL pattern:", pattern, error);
      return false;
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
