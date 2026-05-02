import definition from "./llm-openai.definition";
import { BaseAction } from "@/types/actions";
import { OpenAIService } from "@/services/openai";
import { NotificationService } from "@/services/notification";
import { ApiClient } from "@/api/client";

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

    if (credentialId === "houdin") {
      NotificationService.showNotificationFromBackground({
        message: "Calling Houdin API...",
        timeout: 1000,
      });

      try {
        const response = await ApiClient.action<LLMOpenAIActionOutput>(
          this.metadata.type,
          {
            model: model === "custom" ? (customModel ?? "") : model,
            prompt,
          },
        );
        onSuccess(response);
      } catch (error: any) {
        onError(error as Error);
      }
    } else {
      try {
        // Show loading notification
        NotificationService.showNotificationFromBackground({
          title: "Calling OpenAI API...",
          timeout: 1000,
        });

        const selectedModel = model === "custom" ? (customModel ?? "") : model;

        // Call OpenAI API
        const response = await OpenAIService.callChatCompletion(
          credentialId,
          selectedModel,
          prompt,
          maxTokens,
          temperature,
        );

        // Store the response in the execution context
        onSuccess({
          response,
          model: selectedModel,
          tokensUsed: undefined, // OpenAI service doesn't return token count currently
        });
      } catch (error: any) {
        // Store empty response on error
        onError(error as Error);
      }
    }
  }
}
