// Manifest V3 compatible HTTP trigger system
// Uses fetch interception in content scripts instead of webRequest API

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

export class HttpListenerServiceV3 {
  private static instance: HttpListenerServiceV3 | null = null;
  private triggers: HttpTrigger[] = [];
  private runtime: any;
  private isInjected = false;

  constructor(runtime: any) {
    this.runtime = runtime;
  }

  static getInstance(runtime?: any): HttpListenerServiceV3 {
    if (!HttpListenerServiceV3.instance) {
      if (!runtime) {
        throw new Error('Runtime must be provided when creating HttpListenerServiceV3 instance');
      }
      HttpListenerServiceV3.instance = new HttpListenerServiceV3(runtime);
    }
    return HttpListenerServiceV3.instance;
  }

  // Called from background script to update triggers
  updateTriggers(triggers: HttpTrigger[]): void {
    this.triggers = triggers;
    this.injectFetchInterceptor();
  }

  // Inject fetch interceptor into the page
  private injectFetchInterceptor(): void {
    if (this.isInjected) return;
    this.isInjected = true;

    console.debug("HttpListenerV3: Injecting fetch interceptor");

    // Store original fetch
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        if (window.__httpTriggerInterceptorInstalled) return;
        window.__httpTriggerInterceptorInstalled = true;
        
        const originalFetch = window.fetch;
        const extensionId = '${this.runtime.runtime.id}';
        
        window.fetch = async function(...args) {
          const [resource, init = {}] = args;
          const url = typeof resource === 'string' ? resource : resource.url;
          const method = init.method || 'GET';
          
          const requestId = Math.random().toString(36).substr(2, 9);
          const timestamp = Date.now();
          
          // Extract headers
          const headers = {};
          if (init.headers) {
            if (init.headers instanceof Headers) {
              for (const [key, value] of init.headers.entries()) {
                headers[key] = value;
              }
            } else if (Array.isArray(init.headers)) {
              for (const [key, value] of init.headers) {
                headers[key] = value;
              }
            } else {
              Object.assign(headers, init.headers);
            }
          }
          
          // Send request data to content script
          window.postMessage({
            type: 'HTTP_REQUEST_INTERCEPTED',
            data: {
              url,
              method,
              headers,
              requestId,
              timestamp,
              body: init.body
            }
          }, '*');
          
          try {
            const response = await originalFetch.apply(this, args);
            
            // Extract response headers
            const responseHeaders = {};
            for (const [key, value] of response.headers.entries()) {
              responseHeaders[key] = value;
            }
            
            // Send response data to content script
            window.postMessage({
              type: 'HTTP_RESPONSE_INTERCEPTED',
              data: {
                requestId,
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
                timestamp: Date.now()
              }
            }, '*');
            
            return response;
          } catch (error) {
            // Send error data to content script
            window.postMessage({
              type: 'HTTP_RESPONSE_INTERCEPTED',
              data: {
                requestId,
                status: 0,
                statusText: 'Network Error',
                headers: {},
                timestamp: Date.now(),
                error: error.message
              }
            }, '*');
            
            throw error;
          }
        };
      })();
    `;
    
    document.documentElement.appendChild(script);
    script.remove();

    // Listen for intercepted requests
    window.addEventListener('message', this.handleInterceptedRequest.bind(this));
  }

  private pendingRequests = new Map<string, RequestData>();

  private handleInterceptedRequest = (event: MessageEvent) => {
    if (event.source !== window) return;

    if (event.data.type === 'HTTP_REQUEST_INTERCEPTED') {
      const requestData: RequestData = {
        ...event.data.data,
        tabId: 0 // Will be set by background script
      };
      
      this.pendingRequests.set(requestData.requestId, requestData);
      // Only check triggers on request, not response to avoid duplicate firing
      this.checkTriggers(requestData);
    } else if (event.data.type === 'HTTP_RESPONSE_INTERCEPTED') {
      const responseData: ResponseData = event.data.data;
      const requestData = this.pendingRequests.get(responseData.requestId);
      
      if (requestData) {
        // Store response data but don't trigger workflows again
        // This is available for future use if needed
        this.pendingRequests.delete(responseData.requestId);
      }
    }
  };

  private checkTriggers(requestData: RequestData): void {
    for (const trigger of this.triggers) {
      if (this.matchesPattern(requestData.url, trigger.urlPattern) && 
          this.matchesMethod(requestData.method, trigger.method)) {
        
        console.debug("HttpListenerV3: Trigger matched", trigger);
        
        // Send to background script
        this.runtime.runtime.sendMessage({
          type: "HTTP_TRIGGER_MATCHED",
          data: {
            request: requestData
          },
          triggerNodeId: trigger.triggerNodeId,
          workflowId: trigger.workflowId
        });
      }
    }
  }

  private matchesPattern(url: string, pattern: string): boolean {
    try {
      const regexPattern = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\\*/g, '.*');
      
      const regex = new RegExp(`^${regexPattern}$`, 'i');
      return regex.test(url);
    } catch (error) {
      console.error("Invalid URL pattern:", pattern, error);
      return false;
    }
  }

  private matchesMethod(requestMethod: string, configMethod: string): boolean {
    return configMethod === 'ANY' || requestMethod.toUpperCase() === configMethod.toUpperCase();
  }

  destroy(): void {
    this.triggers = [];
    window.removeEventListener('message', this.handleInterceptedRequest);
    HttpListenerServiceV3.instance = null;
  }
}