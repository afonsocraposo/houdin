import { ApiClient } from "@/api/client";
import { ChatCompletionService } from "@/services/chatCompletion";
import { NotificationService } from "@/services/notification";
import { OpenAIService } from "@/services/openai";
import { BaseAction, ActionMetadata } from "@/types/actions";
import {
  credentialsProperty,
  numberProperty,
  selectProperty,
  textProperty,
  textareaProperty,
} from "@/types/config-properties";
import { IconAi } from "@tabler/icons-react";

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
  static readonly metadata: ActionMetadata = {
    type: "ai",
    label: "AI",
    icon: IconAi,
    description: "Send a prompt to OpenAI, OpenRouter, or Houdin Plus",
    disableTimeout: true,
  };

  static readonly configSchema = {
    properties: {
      provider: selectProperty({
        label: "Provider",
        options: [
          { label: "OpenRouter", value: "openrouter" },
          { label: "OpenAI", value: "openai" },
          { label: "Houdin Plus", value: "houdin" },
        ],
        defaultValue: "openrouter",
        required: true,
      }),
      openAICredentialId: credentialsProperty({
        credentialType: "openai",
        label: "OpenAI Credential",
        placeholder: "Select an OpenAI API key",
        description: "Choose the OpenAI API credential to use",
        required: true,
        showWhen: {
          field: "provider",
          value: "openai",
        },
      }),
      openRouterCredentialId: credentialsProperty({
        credentialType: "secret",
        label: "OpenRouter Secret",
        placeholder: "Select a secret token",
        description:
          "Choose the secret credential containing your OpenRouter API key",
        required: true,
        showWhen: {
          field: "provider",
          value: "openrouter",
        },
      }),
      openAIModel: selectProperty({
        label: "Model",
        options: [
          { label: "gpt-5", value: "gpt-5" },
          { label: "gpt-4o-mini", value: "gpt-4o-mini" },
          { label: "gpt-4o", value: "gpt-4o" },
          { label: "gpt-3.5-turbo", value: "gpt-3.5-turbo" },
          { label: "Other", value: "custom" },
        ],
        defaultValue: "gpt-4o-mini",
        description:
          "Choose a common OpenAI model or select 'Other' to enter a custom one.",
        required: true,
        showWhen: {
          field: "provider",
          value: "openai",
        },
      }),
      openAICustomModel: textProperty({
        label: "Other Model",
        placeholder: "e.g., gpt-4.1-mini",
        description: "Specify the OpenAI model name",
        required: true,
        showWhen: [
          {
            field: "provider",
            value: "openai",
          },
          {
            field: "openAIModel",
            value: "custom",
          },
        ],
      }),
      openRouterModel: selectProperty({
        label: "Model",
        options: [
          { label: "openai/gpt-4o-mini", value: "openai/gpt-4o-mini" },
          { label: "openai/gpt-4o", value: "openai/gpt-4o" },
          {
            label: "anthropic/claude-3.5-sonnet",
            value: "anthropic/claude-3.5-sonnet",
          },
          {
            label: "google/gemini-2.0-flash-001",
            value: "google/gemini-2.0-flash-001",
          },
          { label: "Other", value: "custom" },
        ],
        defaultValue: "openai/gpt-4o-mini",
        description:
          "Choose a common OpenRouter model or select 'Other' to enter a custom one.",
        required: true,
        showWhen: {
          field: "provider",
          value: "openrouter",
        },
      }),
      openRouterCustomModel: textProperty({
        label: "Other Model",
        placeholder: "e.g., mistralai/mistral-small-24b-instruct-2501",
        description:
          "Specify the OpenRouter model name. Check the [free models](https://openrouter.ai/collections/free-models)",
        required: true,
        showWhen: [
          {
            field: "provider",
            value: "openrouter",
          },
          {
            field: "openRouterModel",
            value: "custom",
          },
        ],
      }),
      prompt: textareaProperty({
        label: "Prompt",
        placeholder:
          "You are a helpful assistant. User input: {{get-content-node}}",
        description: "Use {{node-id}} to reference outputs from other actions",
        rows: 4,
        required: true,
      }),
      maxTokens: numberProperty({
        label: "Max Tokens",
        placeholder: "1000",
        description:
          "Maximum number of tokens to generate (optional, uses model default if not set)",
        min: 1,
        max: 4000,
        required: false,
      }),
      temperature: numberProperty({
        label: "Temperature",
        placeholder: "0.7",
        description:
          "Controls randomness (optional, uses model default if not set)",
        min: 0,
        max: 2,
        step: 0.1,
        required: false,
      }),
    },
  };

  readonly outputExample = {
    response: "This is a sample AI response to your prompt.",
    model: "openai/gpt-4o-mini",
    tokensUsed: 45,
  };

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
