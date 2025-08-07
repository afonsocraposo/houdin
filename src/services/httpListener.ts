interface HttpTrigger {
  workflowId: string;
  triggerNodeId: string;
  urlPattern: string;
  method: string;
}

interface RequestData {
  url: string;
  method: string;
  headers: Record<string, string>;
  requestId: string;
  timestamp: number;
  tabId: number;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  requestId: string;
  timestamp: number;
}

interface HttpTriggerData {
  request: RequestData;
  response: ResponseData;
}

type HttpTriggerCallback = (data: HttpTriggerData, triggerNodeId: string, workflowId: string) => void;

export class HttpListenerService {
  private static instance: HttpListenerService | null = null;
  private triggers = new Map<string, HttpTrigger>();
  private pendingRequests = new Map<string, RequestData>();
  private onTriggerCallback: HttpTriggerCallback | null = null;
  private runtime: any;
  private isListening = false;

  constructor(runtime: any) {
    this.runtime = runtime;
  }

  static getInstance(runtime?: any): HttpListenerService {
    if (!HttpListenerService.instance) {
      if (!runtime) {
        throw new Error('Runtime must be provided when creating HttpListenerService instance');
      }
      HttpListenerService.instance = new HttpListenerService(runtime);
    }
    return HttpListenerService.instance;
  }

  setTriggerCallback(callback: HttpTriggerCallback): void {
    this.onTriggerCallback = callback;
  }

  registerTrigger(workflowId: string, triggerNodeId: string, urlPattern: string, method: string): void {
    const triggerKey = `${workflowId}-${triggerNodeId}`;
    this.triggers.set(triggerKey, {
      workflowId,
      triggerNodeId,
      urlPattern,
      method
    });
    
    // Start listening if this is the first trigger
    if (this.triggers.size === 1 && !this.isListening) {
      this.startListening();
    }
  }

  unregisterTrigger(workflowId: string, triggerNodeId: string): void {
    const triggerKey = `${workflowId}-${triggerNodeId}`;
    this.triggers.delete(triggerKey);
    
    // Stop listening if no triggers remain
    if (this.triggers.size === 0 && this.isListening) {
      this.stopListening();
    }
  }

  private startListening(): void {
    if (this.isListening) return;

    // Check if webRequest API is available
    if (!this.runtime.webRequest) {
      console.error('webRequest API is not available. Make sure you have the webRequest permission in manifest.json');
      return;
    }

    this.isListening = true;

    try {
      // Listen for requests being sent
      this.runtime.webRequest.onBeforeRequest.addListener(
        this.onBeforeRequest.bind(this),
        { urls: ["<all_urls>"] }
      );

      // Listen for request headers
      this.runtime.webRequest.onBeforeSendHeaders.addListener(
        this.onBeforeSendHeaders.bind(this),
        { urls: ["<all_urls>"] },
        ["requestHeaders"]
      );

      // Listen for responses
      this.runtime.webRequest.onHeadersReceived.addListener(
        this.onHeadersReceived.bind(this),
        { urls: ["<all_urls>"] },
        ["responseHeaders"]
      );
    } catch (error) {
      console.error('Error setting up webRequest listeners:', error);
      this.isListening = false;
    }
  }

  private stopListening(): void {
    if (!this.isListening || !this.runtime.webRequest) return;

    this.isListening = false;

    try {
      this.runtime.webRequest.onBeforeRequest.removeListener(this.onBeforeRequest.bind(this));
      this.runtime.webRequest.onBeforeSendHeaders.removeListener(this.onBeforeSendHeaders.bind(this));
      this.runtime.webRequest.onHeadersReceived.removeListener(this.onHeadersReceived.bind(this));
    } catch (error) {
      console.error('Error removing webRequest listeners:', error);
    }
    
    this.pendingRequests.clear();
  }

  private onBeforeRequest(details: any): void {
    // Check if any trigger matches this request
    for (const [triggerKey, trigger] of this.triggers) {
      if (this.matchesPattern(details.url, trigger.urlPattern) && 
          this.matchesMethod(details.method, trigger.method)) {
        
        const requestData: RequestData = {
          url: details.url,
          method: details.method,
          headers: {},
          requestId: details.requestId,
          timestamp: details.timeStamp,
          tabId: details.tabId
        };

        this.pendingRequests.set(`${details.requestId}-${triggerKey}`, requestData);
      }
    }
  }

  private onBeforeSendHeaders(details: any): void {
    // Update request headers for all matching pending requests
    for (const [key, requestData] of this.pendingRequests) {
      if (key.startsWith(details.requestId + '-') && details.requestHeaders) {
        const headers: Record<string, string> = {};
        details.requestHeaders.forEach((header: any) => {
          if (header.name && header.value) {
            headers[header.name] = header.value;
          }
        });
        requestData.headers = headers;
      }
    }
  }

  private onHeadersReceived(details: any): void {
    // Process response for all matching triggers
    for (const [triggerKey, trigger] of this.triggers) {
      const requestKey = `${details.requestId}-${triggerKey}`;
      const requestData = this.pendingRequests.get(requestKey);
      
      if (requestData) {
        const responseHeaders: Record<string, string> = {};
        if (details.responseHeaders) {
          details.responseHeaders.forEach((header: any) => {
            if (header.name && header.value) {
              responseHeaders[header.name] = header.value;
            }
          });
        }

        const responseData: ResponseData = {
          status: details.statusCode,
          statusText: details.statusLine || '',
          headers: responseHeaders,
          requestId: details.requestId,
          timestamp: details.timeStamp
        };

        const triggerData: HttpTriggerData = {
          request: requestData,
          response: responseData
        };

        // Trigger the callback
        if (this.onTriggerCallback) {
          this.onTriggerCallback(triggerData, trigger.triggerNodeId, trigger.workflowId);
        }

        // Clean up
        this.pendingRequests.delete(requestKey);
      }
    }
  }

  private matchesPattern(url: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\*/g, '.*');
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(url);
  }

  private matchesMethod(requestMethod: string, configMethod: string): boolean {
    return configMethod === 'ANY' || requestMethod.toUpperCase() === configMethod.toUpperCase();
  }

  destroy(): void {
    this.stopListening();
    this.triggers.clear();
    this.onTriggerCallback = null;
    HttpListenerService.instance = null;
  }
}