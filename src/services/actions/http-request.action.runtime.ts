import definition from "./http-request.action.definition";
import { BaseAction } from "@/types/actions";
import { NotificationService } from "@/services/notification";
import { CredentialRegistry } from "@/services/credentialRegistry";
import { HttpClientService } from "@/services/httpClient";
import { useStore } from "@/store";

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
  constructor() {
    super(definition);
  }
  private httpClient = HttpClientService.getInstance();

  private parseHeaders(headersJson: string): Record<string, string> {
    if (!headersJson?.trim()) return {};
    try {
      const parsed = JSON.parse(headersJson);
      if (typeof parsed === "object" && parsed !== null) return parsed;
      throw new Error("Headers must be a JSON object");
    } catch (error) {
      throw new Error(`Invalid headers JSON: ${error}`);
    }
  }

  private async getCredentialHeaders(credentialId: string): Promise<Record<string, string>> {
    if (!credentialId) return {};
    try {
      const credentialRegistry = CredentialRegistry.getInstance();
      const credentials = useStore.getState().credentials;
      const credential = credentials.find((c) => c.id === credentialId);
      if (!credential) throw new Error(`Credential ${credentialId} not found`);
      if (credential.type !== "http") throw new Error("Invalid credential: not an HTTP credential");
      const auth = credentialRegistry.getAuth(credential.type, credential.config) as { headers?: Record<string, string> };
      return auth?.headers || {};
    } catch (error) {
      console.warn("Failed to load credential headers:", error);
      return {};
    }
  }

  async execute(config: HttpRequestActionConfig, _workflowId: string, _nodeId: string, onSuccess: (data?: any) => void, onError: (error: Error) => void): Promise<void> {
    const { url, method, headers: headersJson, body, contentType, customContentType, credentialId, timeout = 30, followRedirects = true } = config;
    if (!url?.trim()) throw new Error("URL is required");
    try {
      const customHeaders = headersJson ? this.parseHeaders(headersJson) : {};
      const credentialHeaders = await this.getCredentialHeaders(credentialId || "");
      const allHeaders: Record<string, string> = { ...credentialHeaders, ...customHeaders };
      if (["POST", "PUT", "PATCH"].includes(method)) {
        const finalContentType = contentType === "custom" ? customContentType : contentType;
        if (finalContentType) allHeaders["Content-Type"] = finalContentType;
      }
      let requestBody: string | undefined;
      if (body && ["POST", "PUT", "PATCH"].includes(method) && contentType === "application/x-www-form-urlencoded") {
        try { requestBody = new URLSearchParams(JSON.parse(body)).toString(); } catch {}
      }
      NotificationService.showNotification({ title: `Making ${method} request...`, timeout: 1000 });
      const response = await this.httpClient.request({ url, method, headers: allHeaders, body: requestBody, timeout: timeout * 1000, followRedirects });
      onSuccess({ status: response.status, statusText: response.statusText, headers: response.headers, data: response.data, url: response.url });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      NotificationService.showErrorNotification({ title: "HTTP Request Failed", timeout: 3000, message: `HTTP request failed: ${errorMessage}` });
      onError(new Error(`HTTP request failed: ${errorMessage}`));
    }
  }
}
