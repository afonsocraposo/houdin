import { CredentialRegistry } from "./credentialRegistry";
import { HttpClientService } from "./httpClient";
import { useStore } from "@/store";

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ChatCompletionOptions<TAuth extends Record<string, any>> {
  providerName: string;
  credentialType: string;
  credentialId: string;
  baseUrl: string;
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  validateAuth: (auth: TAuth) => boolean;
  buildHeaders: (auth: TAuth) => Record<string, string>;
  invalidAuthMessage: string;
}

export class ChatCompletionService {
  private static httpClient = HttpClientService.getInstance();

  static async callChatCompletion<TAuth extends Record<string, any>>(
    options: ChatCompletionOptions<TAuth>,
  ): Promise<string> {
    const {
      providerName,
      credentialType,
      credentialId,
      baseUrl,
      model,
      prompt,
      maxTokens,
      temperature,
      validateAuth,
      buildHeaders,
      invalidAuthMessage,
    } = options;

    const credentialRegistry = CredentialRegistry.getInstance();
    const credentials = useStore.getState().credentials;
    const credential = credentials.find((c) => c.id === credentialId);

    if (!credential) {
      throw new Error(`${providerName} credential not found`);
    }

    if (credential.type !== credentialType) {
      throw new Error(`Invalid credential: not a ${providerName} credential`);
    }

    const auth = credentialRegistry.getAuth(
      credential.type,
      credential.config,
    ) as TAuth;

    if (!auth || !validateAuth(auth)) {
      throw new Error(invalidAuthMessage);
    }

    const requestBody: ChatCompletionRequest = {
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    if (maxTokens !== undefined) {
      requestBody.max_tokens = maxTokens;
    }

    if (temperature !== undefined) {
      requestBody.temperature = temperature;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...buildHeaders(auth),
    };

    const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
    const data = await this.httpClient.postJson<ChatCompletionResponse>(
      `${normalizedBaseUrl}/chat/completions`,
      requestBody,
      { headers },
    );

    if (!data.choices || data.choices.length === 0) {
      throw new Error(`No response from ${providerName} API`);
    }

    return data.choices[0].message.content;
  }
}
