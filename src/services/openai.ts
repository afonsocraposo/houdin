import { ChatCompletionService } from "./chatCompletion";

export class OpenAIService {
  static async callChatCompletion(
    credentialId: string,
    model: string,
    prompt: string,
    maxTokens?: number,
    temperature?: number,
  ): Promise<string> {
    return ChatCompletionService.callChatCompletion({
      providerName: "OpenAI",
      credentialType: "openai",
      credentialId,
      baseUrl: "https://api.openai.com/v1",
      model,
      prompt,
      maxTokens,
      temperature,
      validateAuth: (auth: { apiKey: string; organizationId?: string }) =>
        Boolean(auth.apiKey?.trim()),
      buildHeaders: (auth: { apiKey: string; organizationId?: string }) => {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${auth.apiKey}`,
        };

        if (auth.organizationId) {
          headers["OpenAI-Organization"] = auth.organizationId;
        }

        return headers;
      },
      invalidAuthMessage: "Invalid OpenAI credential configuration",
    });
  }
}
