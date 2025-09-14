import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "@/types/actions";
import { OpenAIService } from "@/services/openai";
import { NotificationService } from "@/services/notification";

interface LLMOpenAIActionConfig {
  credentialId: string;
  model: string;
  prompt: string;
  maxTokens?: number; // Made optional
  temperature?: number; // Made optional
}

export class LLMOpenAIAction extends BaseAction<LLMOpenAIActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "llm-openai",
    label: "LLM OpenAI",
    icon: "🤖",
    description: "Send prompt to OpenAI and get response",
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        credentialId: {
          type: "credentials",
          credentialType: "openai",
          label: "OpenAI Credential",
          placeholder: "Select an OpenAI API key",
          description: "Choose the OpenAI API credential to use",
          required: true,
        },
        model: {
          type: "select",
          label: "Model",
          options: [
            { label: "GPT-4o (Omni)", value: "gpt-4o" },
            { label: "GPT-4 Turbo", value: "gpt-4-turbo" },
            { label: "GPT-4o Mini", value: "gpt-4o-mini" },
            { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
            { label: "GPT-3.5 Turbo (16k)", value: "gpt-3.5-turbo-16k" },
          ],
          defaultValue: "gpt-4o-mini",
        },
        prompt: {
          type: "textarea",
          label: "Prompt",
          placeholder:
            "You are a helpful assistant. User input: {{get-content-node}}",
          description:
            "Use {{node-id}} to reference outputs from other actions",
          rows: 4,
          required: true,
        },
        maxTokens: {
          type: "number",
          label: "Max Tokens",
          placeholder: "1000",
          description:
            "Maximum number of tokens to generate (optional, uses model default if not set)",
          min: 1,
          max: 4000,
          required: false, // Made optional
        },
        temperature: {
          type: "number",
          label: "Temperature",
          placeholder: "0.7",
          description:
            "Controls randomness (optional, uses model default if not set)",
          min: 0,
          max: 2,
          step: 0.1,
          required: false, // Made optional
        },
      },
    };
  }
  async execute(
    config: LLMOpenAIActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { credentialId, model, prompt, maxTokens, temperature } = config;

    if (!credentialId) {
      NotificationService.showErrorNotification({
        message: "No OpenAI credential selected",
      });
      onError(new Error("No OpenAI credential available"));
      return;
    }

    if (!prompt) {
      NotificationService.showErrorNotification({
        message: "No prompt provided for OpenAI",
      });
      onError(new Error("No prompt provided for OpenAI"));
      return;
    }

    try {
      // Show loading notification
      NotificationService.showNotification({
        title: "Calling OpenAI API...",
        timeout: 1000,
      });

      // Call OpenAI API
      const response = await OpenAIService.callChatCompletion(
        credentialId,
        model,
        prompt,
        maxTokens,
        temperature,
      );

      // Store the response in the execution context
      onSuccess(response);
    } catch (error: any) {
      NotificationService.showErrorNotification({
        message: `OpenAI API error: ${error}`,
      });
      // Store empty response on error
      onError(error as Error);
    }
  }
}
