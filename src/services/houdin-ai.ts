import { API_BASE_URL } from "@/api/client";
import {
  ChatCompletionResult,
  ChatCompletionService,
} from "./chatCompletion";

export class HoudinAIService {
  static async callChatCompletion(
    prompt: string,
    maxTokens?: number,
    temperature?: number,
  ): Promise<ChatCompletionResult> {
    return ChatCompletionService.callChatCompletion({
      providerName: "Houdin Plus",
      baseUrl: `${API_BASE_URL}/ai`,
      model: "",
      prompt,
      maxTokens,
      temperature,
      headers: {
        "X-Houdin-AI-Source": "ai-action",
      },
      metadata: {
        source: "ai-action",
      },
    });
  }
}
