export interface HttpRequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  followRedirects?: boolean;
  credentials?: {
    type: string;
    config: any;
  };
}

export interface HttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  url: string;
}

export interface BackgroundHttpRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface BackgroundHttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  data?: any;
  error?: string;
}

export class HttpClientService {
  private static instance: HttpClientService;
  private runtime: any;

  private constructor() {
    this.runtime = (typeof browser !== "undefined" ? browser : chrome) as any;
  }

  static getInstance(): HttpClientService {
    if (!HttpClientService.instance) {
      HttpClientService.instance = new HttpClientService();
    }
    return HttpClientService.instance;
  }

  private async makeBackgroundRequest(
    request: BackgroundHttpRequest,
  ): Promise<BackgroundHttpResponse> {
    return new Promise((resolve, reject) => {
      this.runtime.runtime.sendMessage(
        { type: "HTTP_REQUEST", request },
        (response: {
          success: boolean;
          response?: BackgroundHttpResponse;
          error?: string;
        }) => {
          if (this.runtime.runtime.lastError) {
            reject(new Error(this.runtime.runtime.lastError.message));
            return;
          }

          if (response.success && response.response) {
            resolve(response.response);
          } else {
            reject(new Error(response.error || "Request failed"));
          }
        },
      );
    });
  }

  private createTimeoutController(timeoutMs: number): AbortController {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    controller.signal.addEventListener("abort", () => {
      clearTimeout(timeoutId);
    });

    return controller;
  }

  async request(options: HttpRequestOptions): Promise<HttpResponse> {
    const {
      url,
      method = "GET",
      headers = {},
      body,
      timeout = 30000,
    } = options;

    if (!url?.trim()) {
      throw new Error("URL is required");
    }

    try {
      // Create timeout controller for the request
      const controller = this.createTimeoutController(timeout);

      // Prepare the background request
      const backgroundRequest: BackgroundHttpRequest = {
        url: url.trim(),
        method,
        headers: { ...headers },
        body,
      };

      // Make the request through background script
      const backgroundResponse = await Promise.race([
        this.makeBackgroundRequest(backgroundRequest),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error(`Request timeout after ${timeout}ms`));
          });
        }),
      ]);

      // Convert background response to our HttpResponse format
      const response: HttpResponse = {
        ok: backgroundResponse.ok,
        status: backgroundResponse.status,
        statusText: backgroundResponse.statusText,
        headers: {}, // Background script doesn't return headers yet
        data: backgroundResponse.data,
        url: backgroundResponse.ok ? url : "",
      };

      // Handle error cases
      if (!response.ok) {
        const errorMessage =
          backgroundResponse.error ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return response;
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          throw new Error(`Request timeout after ${timeout}ms`);
        } else if (error.message.includes("fetch")) {
          throw new Error(`Network error: Unable to reach ${url}`);
        }
        throw error;
      }

      throw new Error(`HTTP request failed: ${String(error)}`);
    }
  }

  async get(
    url: string,
    options: Omit<HttpRequestOptions, "url" | "method"> = {},
  ): Promise<HttpResponse> {
    return this.request({ ...options, url, method: "GET" });
  }

  async post(
    url: string,
    body?: string,
    options: Omit<HttpRequestOptions, "url" | "method" | "body"> = {},
  ): Promise<HttpResponse> {
    return this.request({ ...options, url, method: "POST", body });
  }

  async put(
    url: string,
    body?: string,
    options: Omit<HttpRequestOptions, "url" | "method" | "body"> = {},
  ): Promise<HttpResponse> {
    return this.request({ ...options, url, method: "PUT", body });
  }

  async patch(
    url: string,
    body?: string,
    options: Omit<HttpRequestOptions, "url" | "method" | "body"> = {},
  ): Promise<HttpResponse> {
    return this.request({ ...options, url, method: "PATCH", body });
  }

  async delete(
    url: string,
    options: Omit<HttpRequestOptions, "url" | "method"> = {},
  ): Promise<HttpResponse> {
    return this.request({ ...options, url, method: "DELETE" });
  }

  async postJson<T = any>(
    url: string,
    data: any,
    options: Omit<HttpRequestOptions, "url" | "method" | "body"> = {},
  ): Promise<T> {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const response = await this.post(url, JSON.stringify(data), {
      ...options,
      headers,
    });
    return response.data;
  }

  async putJson<T = any>(
    url: string,
    data: any,
    options: Omit<HttpRequestOptions, "url" | "method" | "body"> = {},
  ): Promise<T> {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const response = await this.put(url, JSON.stringify(data), {
      ...options,
      headers,
    });
    return response.data;
  }

  async patchJson<T = any>(
    url: string,
    data: any,
    options: Omit<HttpRequestOptions, "url" | "method" | "body"> = {},
  ): Promise<T> {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const response = await this.patch(url, JSON.stringify(data), {
      ...options,
      headers,
    });
    return response.data;
  }
}
