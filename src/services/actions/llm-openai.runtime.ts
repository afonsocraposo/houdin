import definition from "./llm-openai.definition";
import { BaseAction } from "@/types/actions";
import { HoudinAIService } from "@/services/houdin-ai";
import { OpenAIService } from "@/services/openai";
import { NotificationService } from "@/services/notification";

interface LLMOpenAIActionConfig {
  credentialId: string;
  model: string;
  customModel?: string; // Made optional
  prompt: string;
  maxTokens?: number; // Made optional
  temperature?: number; // Made optional
}

interface LLMOpenAIActionOutput {
  response: string;
  model: string;
  tokensUsed?: number;
}

export class LLMOpenAIAction extends BaseAction<
  LLMOpenAIActionConfig,
  LLMOpenAIActionOutput
> {
  constructor() {
    super(definition);
  }

  async execute(
    config: LLMOpenAIActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: LLMOpenAIActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { credentialId, model, customModel, prompt, maxTokens, temperature } =
      config;

    if (!credentialId) {
      NotificationService.showErrorNotificationFromBackground({
        message: "No OpenAI credential selected",
      });
      onError(new Error("No OpenAI credential available"));
      return;
    }

    if (!prompt) {
      NotificationService.showErrorNotificationFromBackground({
        message: "No prompt provided for OpenAI",
      });
      onError(new Error("No prompt provided for OpenAI"));
      return;
    }

    NotificationService.showNotificationFromBackground({
      message:
        credentialId === "houdin"
          ? "Calling Houdin AI..."
          : `Calling OpenAI (${model === "custom" ? customModel : model})...`,
      timeout: 1000,
    });

    try {
      const selectedModel = model === "custom" ? (customModel ?? "") : model;

      const result =
        credentialId === "houdin"
          ? await HoudinAIService.callChatCompletion(prompt, maxTokens, temperature)
          : await OpenAIService.callChatCompletion(
              credentialId,
              selectedModel,
              prompt,
              maxTokens,
              temperature,
            );

      onSuccess({
        response: result.response,
        model: credentialId === "houdin" ? "houdin-plus" : selectedModel,
        tokensUsed: result.tokensUsed,
      });
    } catch (error: any) {
      onError(error as Error);
    }
  }
}
