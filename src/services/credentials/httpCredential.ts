import { BaseCredential, CredentialMetadata } from "@/types/credentials";
import { ConfigSchema } from "@/types/config-properties";

interface HTTPConfig {
  authType: "none" | "bearer" | "basic" | "api_key";
  token?: string; // For bearer and API key auth
  username?: string; // For basic auth
  password?: string; // For basic auth
  apiKeyHeader?: string; // Header name for API key auth
  apiKeyValue?: string; // Value for API key auth
}

interface HTTPAuth {
  type: "none" | "bearer" | "basic" | "api_key";
  headers?: Record<string, string>;
  credentials?: {
    username: string;
    password: string;
  };
}

export class HTTPCredential extends BaseCredential<HTTPConfig, HTTPAuth> {
  readonly metadata: CredentialMetadata = {
    type: "http",
    label: "HTTP Authentication",
    icon: "IconWorld",
    description: "HTTP authentication credentials for API requests",
  };

  getConfigSchema(): ConfigSchema {
    return {
      properties: {
        authType: {
          type: "select",
          label: "Authentication Type",
          description: "Type of HTTP authentication to use",
          required: true,
          defaultValue: "none",
          options: [
            { value: "none", label: "No Authentication" },
            { value: "bearer", label: "Bearer Token" },
            { value: "basic", label: "Basic Authentication" },
            { value: "api_key", label: "API Key Header" },
          ],
        },
        token: {
          type: "string",
          label: "Bearer Token",
          description: "Bearer token for authentication",
          required: false,
          sensitive: true,
          placeholder: "Enter bearer token...",
          showWhen: {
            field: "authType",
            value: "bearer",
          },
        },
        username: {
          type: "string",
          label: "Username",
          description: "Username for basic authentication",
          required: false,
          placeholder: "Enter username...",
          showWhen: {
            field: "authType",
            value: "basic",
          },
        },
        password: {
          type: "string",
          label: "Password",
          description: "Password for basic authentication",
          required: false,
          sensitive: true,
          placeholder: "Enter password...",
          showWhen: {
            field: "authType",
            value: "basic",
          },
        },
        apiKeyHeader: {
          type: "string",
          label: "API Key Header",
          description: "Header name for API key (e.g., X-API-Key)",
          required: false,
          placeholder: "X-API-Key",
          showWhen: {
            field: "authType",
            value: "api_key",
          },
        },
        apiKeyValue: {
          type: "string",
          label: "API Key Value",
          description: "API key value",
          required: false,
          sensitive: true,
          placeholder: "Enter API key...",
          showWhen: {
            field: "authType",
            value: "api_key",
          },
        },
      },
    };
  }

  getAuth(config: HTTPConfig): HTTPAuth {
    const auth: HTTPAuth = {
      type: config.authType,
    };

    switch (config.authType) {
      case "bearer":
        if (config.token?.trim()) {
          auth.headers = {
            Authorization: `Bearer ${config.token}`,
          };
        }
        break;

      case "basic":
        if (config.username?.trim() && config.password?.trim()) {
          auth.credentials = {
            username: config.username,
            password: config.password,
          };
          // Also provide the header for convenience
          const encoded = btoa(`${config.username}:${config.password}`);
          auth.headers = {
            Authorization: `Basic ${encoded}`,
          };
        }
        break;

      case "api_key":
        if (config.apiKeyHeader?.trim() && config.apiKeyValue?.trim()) {
          auth.headers = {
            [config.apiKeyHeader]: config.apiKeyValue,
          };
        }
        break;

      case "none":
      default:
        // No authentication needed
        break;
    }

    return auth;
  }
}
