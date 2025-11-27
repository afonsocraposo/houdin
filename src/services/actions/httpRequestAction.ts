import { BaseAction, ActionMetadata } from "@/types/actions";
import { NotificationService } from "@/services/notification";
import { ContentStorageClient } from "@/services/storage";
import { CredentialRegistry } from "@/services/credentialRegistry";
import { HttpClientService } from "@/services/httpClient";
import {
  booleanProperty,
  codeProperty,
  credentialsProperty,
  numberProperty,
  selectProperty,
  textProperty,
} from "@/types/config-properties";
import { IconWorld } from "@tabler/icons-react";

interface HttpRequestActionConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: string;
  body?: string;
  contentType:
    | "application/json"
    | "application/x-www-form-urlencoded"
    | "text/plain"
    | "custom";
  customContentType?: string;
  credentialId?: string;
  timeout?: number;
  followRedirects?: boolean;
}

interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  url: string;
}

export class HttpRequestAction extends BaseAction<
  HttpRequestActionConfig,
  HttpResponse
> {
  static readonly metadata: ActionMetadata = {
    type: "http-request",
    label: "HTTP Request",
    icon: IconWorld,
    description: "Make HTTP request to any URL with custom headers and body",
    disableTimeout: true,
  };

  private httpClient = HttpClientService.getInstance();

  static readonly configSchema = {
    properties: {
      method: selectProperty({
        label: "HTTP Method",
        options: [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "PATCH", value: "PATCH" },
          { label: "DELETE", value: "DELETE" },
        ],
        defaultValue: "GET",
        description: "HTTP method to use for the request",
        required: true,
      }),
      url: textProperty({
        label: "URL",
        placeholder: "https://api.example.com/data",
        description:
          "Target URL for the HTTP request. Variables like {{node-id}} can be used",
        required: true,
      }),
      contentType: selectProperty({
        label: "Content Type",
        options: [
          { label: "JSON (application/json)", value: "application/json" },
          {
            label: "Form Data (application/x-www-form-urlencoded)",
            value: "application/x-www-form-urlencoded",
          },
          { label: "Plain Text (text/plain)", value: "text/plain" },
          { label: "Custom", value: "custom" },
        ],
        defaultValue: "application/json",
        description: "Content-Type header for the request",
        showWhen: {
          field: "method",
          value: ["POST", "PUT", "PATCH"],
        },
      }),
      customContentType: textProperty({
        label: "Custom Content Type",
        placeholder: "application/xml",
        description: "Custom Content-Type header value",
        showWhen: {
          field: "contentType",
          value: "custom",
        },
      }),
      headers: codeProperty({
        label: "Headers (JSON)",
        placeholder:
          '{\n  "Authorization": "Bearer {{auth-token}}",\n  "X-Custom-Header": "value"\n}',
        description:
          "Additional HTTP headers as JSON object. Variables like {{node-id}} can be used",
        language: "json",
        height: 150,
      }),
      body: codeProperty({
        label: "Request Body",
        placeholder:
          '{\n  "name": "{{user-input}}",\n  "email": "user@example.com"\n}',
        description:
          "Request body content. Variables like {{node-id}} can be used",
        language: "json",
        height: 200,
        showWhen: {
          field: "method",
          value: ["POST", "PUT", "PATCH"],
        },
      }),
      credentialId: credentialsProperty({
        credentialType: "http",
        label: "HTTP Credential (Optional)",
        placeholder: "Select HTTP credential for authentication",
        description: "Optional HTTP credential for authentication",
        required: false,
      }),
      timeout: numberProperty({
        label: "Timeout (seconds)",
        placeholder: "30",
        description: "Request timeout in seconds (default: 30)",
        min: 1,
        max: 300,
        defaultValue: 30,
      }),
      followRedirects: booleanProperty({
        label: "Follow Redirects",
        description: "Whether to follow HTTP redirects",
        defaultValue: true,
      }),
    },
  };

  readonly outputExample = {
    status: 200,
    statusText: "OK",
    headers: {
      "content-type": "application/json",
      "x-custom-header": "value",
    },
    data: {
      id: 123,
      name: "Sample Data",
    },
    url: "https://api.example.com/data",
  };

  private parseHeaders(headersJson: string): Record<string, string> {
    if (!headersJson?.trim()) return {};

    try {
      const parsed = JSON.parse(headersJson);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed;
      }
      throw new Error("Headers must be a JSON object");
    } catch (error) {
      throw new Error(`Invalid headers JSON: ${error}`);
    }
  }

  private async getCredentialHeaders(
    credentialId: string,
  ): Promise<Record<string, string>> {
    if (!credentialId) return {};

    try {
      // Get the credential from storage
      const storageClient = new ContentStorageClient();
      const credentialRegistry = CredentialRegistry.getInstance();
      const credentials = await storageClient.getCredentials();
      const credential = credentials.find((c) => c.id === credentialId);

      if (!credential) {
        throw new Error(`Credential ${credentialId} not found`);
      }

      if (credential.type !== "http") {
        throw new Error("Invalid credential: not an HTTP credential");
      }

      // Get authentication details from registry
      const auth = credentialRegistry.getAuth(
        credential.type,
        credential.config,
      ) as {
        type: string;
        headers?: Record<string, string>;
      };

      return auth?.headers || {};
    } catch (error) {
      console.warn("Failed to load credential headers:", error);
      return {};
    }
  }

  async execute(
    config: HttpRequestActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const {
      url,
      method,
      headers: headersJson,
      body,
      contentType,
      customContentType,
      credentialId,
      timeout = 30,
      followRedirects = true,
    } = config;

    if (!url?.trim()) {
      throw new Error("URL is required");
    }

    try {
      const customHeaders = headersJson ? this.parseHeaders(headersJson) : {};

      // Get credential headers
      const credentialHeaders = await this.getCredentialHeaders(
        credentialId || "",
      );

      // Combine headers
      const allHeaders: Record<string, string> = {
        ...credentialHeaders,
        ...customHeaders,
      };

      // Set content type for requests with body
      if (["POST", "PUT", "PATCH"].includes(method)) {
        const finalContentType =
          contentType === "custom" ? customContentType : contentType;
        if (finalContentType) {
          allHeaders["Content-Type"] = finalContentType;
        }
      }

      // Prepare request body
      let requestBody: string | undefined;
      if (body && ["POST", "PUT", "PATCH"].includes(method)) {
        // Auto-format for form data
        if (contentType === "application/x-www-form-urlencoded") {
          try {
            const bodyObj = JSON.parse(body);
            requestBody = new URLSearchParams(bodyObj).toString();
          } catch {
            // If it's not valid JSON, assume it's already form-encoded
          }
        }
      }

      // Show loading notification
      NotificationService.showNotification({
        title: `Making ${method} request...`,
        timeout: 1000,
      });

      // Make the HTTP request using the HTTP client service
      const response = await this.httpClient.request({
        url,
        method,
        headers: allHeaders,
        body: requestBody,
        timeout: timeout * 1000,
        followRedirects,
      });

      // Create response object compatible with existing interface
      const httpResponse: HttpResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        url: response.url,
      };

      // Store the response
      onSuccess(httpResponse);

      console.debug(`HTTP ${method} request completed:`, {
        url,
        status: response.status,
        headers: response.headers,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      NotificationService.showErrorNotification({
        title: "HTTP Request Failed",
        timeout: 3000,
        message: `HTTP request failed: ${errorMessage}`,
      });

      // Handle specific error types
      if (errorMessage.includes("Network error")) {
        onError(new Error(`Network error: Unable to reach ${url}`));
      } else if (errorMessage.includes("timeout")) {
        onError(new Error(`Request timeout after ${timeout} seconds`));
      } else {
        onError(new Error(`HTTP request failed: ${errorMessage}`));
      }
    }
  }
}
