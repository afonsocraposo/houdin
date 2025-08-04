import { StorageManager } from "./storage";

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

interface HttpRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface HttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  data?: any;
  error?: string;
}

export class OpenAIService {
  private static readonly API_BASE_URL = "https://api.openai.com/v1";

  private static async makeBackgroundRequest(
    request: HttpRequest,
  ): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      const runtime = (
        typeof browser !== "undefined" ? browser : chrome
      ) as any;

      runtime.runtime.sendMessage(
        { type: "HTTP_REQUEST", request },
        (response: {
          success: boolean;
          response?: HttpResponse;
          error?: string;
        }) => {
          if (response.success && response.response) {
            resolve(response.response);
          } else {
            reject(new Error(response.error || "Request failed"));
          }
        },
      );
    });
  }

  static async callChatCompletion(
    credentialId: string,
    model: string,
    prompt: string,
    maxTokens: number = 150,
    temperature: number = 0.7,
  ): Promise<string> {
    try {
      // Get the credential
      const storageManager = StorageManager.getInstance();
      const credentials = await storageManager.getCredentials();
      const credential = credentials.find((c) => c.id === credentialId);

      if (!credential) {
        throw new Error("OpenAI credential not found");
      }

      if (credential.service !== "openai") {
        throw new Error("Invalid credential: not an OpenAI credential");
      }

      // Prepare the request
      const requestBody: OpenAIRequest = {
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        // max_tokens: maxTokens,
        // temperature
      };

      // Make the API call through background script
      const response = await this.makeBackgroundRequest({
        url: `${this.API_BASE_URL}/chat/completions`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${credential.value}`,
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorMessage =
          response.data?.error?.message ||
          response.statusText ||
          "Unknown error";
        throw new Error(`OpenAI API error: ${errorMessage}`);
      }

      const data: OpenAIResponse = response.data;

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from OpenAI API");
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI API call failed:", error);
      throw error;
    }
  }
}
