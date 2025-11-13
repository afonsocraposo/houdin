import { BackgroundStorageClient } from "./storage";
import { CredentialRegistry } from "./credentialRegistry";
import { HttpClientService } from "./httpClient";

export interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenAIService {
  private static readonly API_BASE_URL = "https://api.openai.com/v1";
  private static httpClient = HttpClientService.getInstance();

  static async callChatCompletion(
    credentialId: string,
    model: string,
    prompt: string,
    maxTokens?: number, // Made optional
    temperature?: number, // Made optional
  ): Promise<string> {
    // Get the credential
    const storageClient = new BackgroundStorageClient();
    const credentialRegistry = CredentialRegistry.getInstance();
    const credentials = await storageClient.getCredentials();
    const credential = credentials.find((c) => c.id === credentialId);

    if (!credential) {
      throw new Error("OpenAI credential not found");
    }

    if (credential.type !== "openai") {
      throw new Error("Invalid credential: not an OpenAI credential");
    }

    // Get authentication details from registry
    const auth = credentialRegistry.getAuth(
      credential.type,
      credential.config,
    ) as {
      apiKey: string;
      organizationId?: string;
    };

    if (!auth || !auth.apiKey) {
      throw new Error("Invalid OpenAI credential configuration");
    }

    // Prepare the request body
    const requestBody: OpenAIRequest = {
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    // Only include optional parameters if they're provided
    if (maxTokens !== undefined) {
      requestBody.max_tokens = maxTokens;
    }
    if (temperature !== undefined) {
      requestBody.temperature = temperature;
    }

    // Prepare headers with auth
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.apiKey}`,
      Accept: "application/json",
    };

    // Add organization header if present
    if (auth.organizationId) {
      headers["OpenAI-Organization"] = auth.organizationId;
    }

    // Make the API call through HTTP client service
    const data = await this.httpClient.postJson<OpenAIResponse>(
      `${this.API_BASE_URL}/chat/completions`,
      requestBody,
      { headers },
    );

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from OpenAI API");
    }

    return data.choices[0].message.content;
  }
}
