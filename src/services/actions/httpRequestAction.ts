import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
  ActionExecutionContext,
} from "../../types/actions";
import { NotificationService } from "../notification";
import { StorageManager } from "../storage";
import { CredentialRegistry } from "../credentialRegistry";
import { HttpClientService } from "../httpClient";

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

export class HttpRequestAction extends BaseAction<HttpRequestActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "http-request",
    label: "HTTP Request",
    icon: "🌐",
    description: "Make HTTP request to any URL with custom headers and body",
  };

  private httpClient = HttpClientService.getInstance();

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        method: {
          type: "select",
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
        },
        url: {
          type: "text",
          label: "URL",
          placeholder: "https://api.example.com/data",
          description:
            "Target URL for the HTTP request. Variables like {{node-id}} can be used",
          required: true,
        },
        contentType: {
          type: "select",
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
        },
        customContentType: {
          type: "text",
          label: "Custom Content Type",
          placeholder: "application/xml",
          description: "Custom Content-Type header value",
          showWhen: {
            field: "contentType",
            value: "custom",
          },
        },
        headers: {
          type: "code",
          label: "Headers (JSON)",
          placeholder:
            '{\n  "Authorization": "Bearer {{auth-token}}",\n  "X-Custom-Header": "value"\n}',
          description:
            "Additional HTTP headers as JSON object. Variables like {{node-id}} can be used",
          language: "json",
          height: 150,
        },
        body: {
          type: "code",
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
        },
        credentialId: {
          type: "credentials",
          credentialType: "http",
          label: "HTTP Credential (Optional)",
          placeholder: "Select HTTP credential for authentication",
          description: "Optional HTTP credential for authentication",
          required: false,
        },
        timeout: {
          type: "number",
          label: "Timeout (seconds)",
          placeholder: "30",
          description: "Request timeout in seconds (default: 30)",
          min: 1,
          max: 300,
          defaultValue: 30,
        },
        followRedirects: {
          type: "boolean",
          label: "Follow Redirects",
          description: "Whether to follow HTTP redirects",
          defaultValue: true,
        },
      },
    };
  }

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
      const storageManager = StorageManager.getInstance();
      const credentialRegistry = CredentialRegistry.getInstance();
      const credentials = await storageManager.getCredentials();
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
    context: ActionExecutionContext,
    nodeId: string,
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
      // Interpolate variables in URL
      const interpolatedUrl = context.interpolateVariables(url);

      // Parse and interpolate headers
      const customHeaders = headersJson
        ? this.parseHeaders(context.interpolateVariables(headersJson))
        : {};

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
        requestBody = context.interpolateVariables(body);

        // Auto-format for form data
        if (contentType === "application/x-www-form-urlencoded") {
          try {
            const bodyObj = JSON.parse(requestBody);
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
        url: interpolatedUrl,
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
      context.setOutput(nodeId, httpResponse);

      console.debug(`HTTP ${method} request completed:`, {
        url: interpolatedUrl,
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
        throw new Error(`Network error: Unable to reach ${url}`);
      } else if (errorMessage.includes("timeout")) {
        throw new Error(`Request timeout after ${timeout} seconds`);
      } else {
        throw new Error(`HTTP request failed: ${errorMessage}`);
      }
    }
  }
}
