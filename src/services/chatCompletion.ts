import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

import { CredentialRegistry } from "./credentialRegistry";
import { useStore } from "@/store";

interface ChatCompletionOptions<TAuth extends Record<string, any>> {
  providerName: string;
  credentialType?: string;
  credentialId?: string;
  baseUrl: string;
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  validateAuth?: (auth: TAuth) => boolean;
  buildHeaders?: (auth: TAuth) => Record<string, string>;
  invalidAuthMessage?: string;
  headers?: Record<string, string>;
  metadata?: Record<string, string>;
}

export interface ChatCompletionResult {
  response: string;
  tokensUsed?: number;
}

export class ChatCompletionService {
  static async callChatCompletion<TAuth extends Record<string, any>>(
    options: ChatCompletionOptions<TAuth>,
  ): Promise<ChatCompletionResult> {
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
      headers: staticHeaders,
      metadata,
    } = options;

    let authHeaders: Record<string, string> = {};

    if (credentialId && credentialType) {
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

      if (!auth || !validateAuth || !validateAuth(auth)) {
        throw new Error(
          invalidAuthMessage || `Invalid ${providerName} credential configuration`,
        );
      }

      authHeaders = buildHeaders ? buildHeaders(auth) : {};
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders,
      ...staticHeaders,
    };

    const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
    const provider = createOpenAI({
      baseURL: normalizedBaseUrl,
      apiKey: headers.Authorization?.replace(/^Bearer\s+/, "") || "houdin-client",
      headers,
    });

    const result = await generateText({
      model: provider.chat(model),
      prompt,
      temperature,
      maxOutputTokens: maxTokens,
      providerOptions: metadata
        ? {
            openai: {
              metadata,
            },
          }
        : undefined,
    });

    if (!result.text?.trim()) {
      throw new Error(`No response from ${providerName} API`);
    }

    return {
      response: result.text,
      tokensUsed: result.usage?.totalTokens,
    };
  }
}
