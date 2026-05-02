import definition from "./ai.definition";
import { ApiClient } from "@/api/client";
import { ChatCompletionService } from "@/services/chatCompletion";
import { NotificationService } from "@/services/notification";
import { OpenAIService } from "@/services/openai";
import { BaseAction } from "@/types/actions";

type AIProvider = "openai" | "openrouter" | "houdin";

interface AIActionConfig {
  provider: AIProvider;
  openAICredentialId?: string;
  openRouterCredentialId?: string;
  openAIModel?: string;
  openAICustomModel?: string;
  openRouterModel?: string;
  openRouterCustomModel?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

interface AIActionOutput {
  response: string;
  model: string | null;
  tokensUsed?: number;
}

export class AIAction extends BaseAction<AIActionConfig, AIActionOutput> {
  constructor() {
    super(definition);
  }

  private getSelectedModel(config: AIActionConfig): string | null {
    switch (config.provider) {
      case "openai":
        return config.openAIModel === "custom"
          ? (config.openAICustomModel ?? "")
          : (config.openAIModel ?? "");
      case "openrouter":
        return config.openRouterModel === "custom"
          ? (config.openRouterCustomModel ?? "")
          : (config.openRouterModel ?? "");
      case "houdin":
        return null;
      default:
        return "";
    }
  }

  async execute(
    config: AIActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: AIActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const {
      provider,
      openAICredentialId,
      openRouterCredentialId,
      prompt,
      maxTokens,
      temperature,
    } = config;
    const selectedModel = this.getSelectedModel(config);

    if (!prompt) {
      NotificationService.showErrorNotificationFromBackground({
        message: "No prompt provided for AI",
      });
      onError(new Error("No prompt provided for AI"));
      return;
    }

    try {
      switch (provider) {
        case "openai": {
          if (!openAICredentialId) {
            NotificationService.showErrorNotificationFromBackground({
              message: "No OpenAI credential selected",
            });
            onError(new Error("No OpenAI credential available"));
            return;
          }

          NotificationService.showNotificationFromBackground({
            title: "Calling OpenAI API...",
            timeout: 1000,
          });

          const response = await OpenAIService.callChatCompletion(
            openAICredentialId,
            selectedModel ?? "",
            prompt,
            maxTokens,
            temperature,
          );

          onSuccess({ response, model: selectedModel, tokensUsed: undefined });
          return;
        }

        case "openrouter": {
          if (!openRouterCredentialId) {
            NotificationService.showErrorNotificationFromBackground({
              message: "No secret credential selected",
            });
            onError(new Error("No secret credential available"));
            return;
          }

          NotificationService.showNotificationFromBackground({
            title: "Calling OpenRouter API...",
            timeout: 1000,
          });

          const response = await ChatCompletionService.callChatCompletion({
            providerName: "OpenRouter",
            credentialType: "secret",
            credentialId: openRouterCredentialId,
            baseUrl: "https://openrouter.ai/api/v1",
            model: selectedModel ?? "",
            prompt,
            maxTokens,
            temperature,
            validateAuth: (auth: { value: string }) =>
              Boolean(auth.value?.trim()),
            buildHeaders: (auth: { value: string }) => ({
              Authorization: `Bearer ${auth.value}`,
              "HTTP-Referer": "https://houdin.dev",
            }),
            invalidAuthMessage: "Invalid OpenRouter secret configuration",
          });

          onSuccess({ response, model: selectedModel, tokensUsed: undefined });
          return;
        }

        case "houdin": {
          NotificationService.showNotificationFromBackground({
            message: "Calling Houdin API...",
            timeout: 1000,
          });

          const response = await ApiClient.action<AIActionOutput>(
            "llm-openai",
            {
              model: null,
              prompt,
            },
          );

          onSuccess(response);
          return;
        }

        default:
          onError(new Error(`Unsupported AI provider: ${provider}`));
      }
    } catch (error: any) {
      onError(error as Error);
    }
  }
}
