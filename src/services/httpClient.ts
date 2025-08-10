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

export class HttpClientService {
  private static instance: HttpClientService;
  private isContentScript: boolean;

  private constructor() {
    // Detect if we're running in a content script context
    this.isContentScript = typeof window !== "undefined" && !!window.location;
  }

  static getInstance(): HttpClientService {
    if (!HttpClientService.instance) {
      HttpClientService.instance = new HttpClientService();
    }
    return HttpClientService.instance;
  }

  private async makeDirectRequest(
    options: HttpRequestOptions,
  ): Promise<HttpResponse> {
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
      console.debug("HttpClient: Making direct request to", url);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions: RequestInit = {
        method,
        headers,
        body,
        signal: controller.signal,
      };

      console.debug("HttpClient: Fetch options", fetchOptions);

      const response = await fetch(url.trim(), fetchOptions);
      clearTimeout(timeoutId);

      console.debug("HttpClient: Response received", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });

      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data: any;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const httpResponse: HttpResponse = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        url: response.url,
      };

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return httpResponse;
    } catch (error) {
      console.error("HttpClient: Direct request failed", {
        url,
        method,
        error: error,
      });

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error(`Request timeout after ${timeout}ms`);
        } else if (error.message.includes("fetch")) {
          throw new Error(`Network error: Unable to reach ${url}`);
        }
        throw error;
      }

      throw new Error(`HTTP request failed: ${String(error)}`);
    }
  }

  async request(options: HttpRequestOptions): Promise<HttpResponse> {
    const { url } = options;

    if (!url?.trim()) {
      throw new Error("URL is required");
    }

    return this.makeDirectRequest(options);
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
