import { BaseAction, ActionMetadata } from "@/types/actions";
import {
  credentialsProperty,
  selectProperty,
  textareaProperty,
  numberProperty,
  textProperty,
} from "@/types/config-properties";
import { NotificationService } from "@/services/notification";
import { IconAi } from "@tabler/icons-react";
import { ChatCompletionService } from "@/services/chatCompletion";

interface LLMOpenRouterActionConfig {
  credentialId: string;
  model: string;
  customModel?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

interface LLMOpenRouterActionOutput {
  response: string;
  model: string;
  tokensUsed?: number;
}

export class LLMOpenRouterAction extends BaseAction<
  LLMOpenRouterActionConfig,
  LLMOpenRouterActionOutput
> {
  static readonly metadata: ActionMetadata = {
    type: "llm-openrouter",
    label: "OpenRouter",
    icon: IconAi,
    description: "Send prompt to OpenRouter and get response",
    disableTimeout: true,
  };

  static readonly configSchema = {
    properties: {
      credentialId: credentialsProperty({
        credentialType: "secret",
        label: "OpenRouter Secret",
        placeholder: "Select a secret token",
        description:
          "Choose the secret credential containing your OpenRouter API key",
        required: true,
      }),
      model: selectProperty({
        label: "Model",
        options: [
          { label: "openai/gpt-4o-mini", value: "openai/gpt-4o-mini" },
          { label: "openai/gpt-4o", value: "openai/gpt-4o" },
          {
            label: "anthropic/claude-3.5-sonnet",
            value: "anthropic/claude-3.5-sonnet",
          },
          { label: "Other", value: "custom" },
        ],
        defaultValue: "openai/gpt-4o-mini",
        description:
          "Select a model or choose 'Other' to specify a custom OpenRouter model name. Check the [free models](https://openrouter.ai/collections/free-models)",
      }),
      customModel: textProperty({
        label: "Other Model",
        placeholder: "e.g., mistralai/mistral-small-24b-instruct-2501",
        description: "Specify the OpenRouter model name",
        showWhen: {
          field: "model",
          value: "custom",
        },
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

  async execute(
    config: LLMOpenRouterActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: LLMOpenRouterActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { credentialId, model, customModel, prompt, maxTokens, temperature } =
      config;

    if (!credentialId) {
      NotificationService.showErrorNotificationFromBackground({
        message: "No secret credential selected",
      });
      onError(new Error("No secret credential available"));
      return;
    }

    if (!prompt) {
      NotificationService.showErrorNotificationFromBackground({
        message: "No prompt provided for OpenRouter",
      });
      onError(new Error("No prompt provided for OpenRouter"));
      return;
    }

    try {
      NotificationService.showNotificationFromBackground({
        title: "Calling OpenRouter API...",
        timeout: 1000,
      });

      const selectedModel = model === "custom" ? (customModel ?? "") : model;

      const response = await ChatCompletionService.callChatCompletion({
        providerName: "OpenRouter",
        credentialType: "secret",
        credentialId,
        baseUrl: "https://openrouter.ai/api/v1",
        model: selectedModel,
        prompt,
        maxTokens,
        temperature,
        validateAuth: (auth: { value: string }) => Boolean(auth.value?.trim()),
        buildHeaders: (auth: { value: string }) => ({
          Authorization: `Bearer ${auth.value}`,
          "HTTP-Referer": "https://houdin.dev",
        }),
        invalidAuthMessage: "Invalid OpenRouter secret configuration",
      });

      onSuccess({
        response,
        model: selectedModel,
        tokensUsed: undefined,
      });
    } catch (error: any) {
      onError(error as Error);
    }
  }
}
