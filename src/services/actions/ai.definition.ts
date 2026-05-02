import type { NodeDefinition } from '../node-definitions/types';
import { credentialsProperty, numberProperty, selectProperty, textProperty, textareaProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "ai",
    label: "AI",
    icon: "IconAi",
    description: "Send a prompt to OpenAI, OpenRouter, or Houdin Plus",
    disableTimeout: true
},
  configSchema: {
    properties: {
        provider: selectProperty({
            label: "Provider",
            options: [
                { label: "OpenRouter", value: "openrouter" },
                { label: "OpenAI", value: "openai" },
                { label: "Houdin Plus", value: "houdin" },
            ],
            defaultValue: "openrouter",
            required: true
        }),
        openAICredentialId: credentialsProperty({
            credentialType: "openai",
            label: "OpenAI Credential",
            placeholder: "Select an OpenAI API key",
            description: "Choose the OpenAI API credential to use",
            required: true,
            showWhen: {
                field: "provider",
                value: "openai"
            }
        }),
        openRouterCredentialId: credentialsProperty({
            credentialType: "secret",
            label: "OpenRouter Secret",
            placeholder: "Select a secret token",
            description: "Choose the secret credential containing your OpenRouter API key",
            required: true,
            showWhen: {
                field: "provider",
                value: "openrouter"
            }
        }),
        openAIModel: selectProperty({
            label: "Model",
            options: [
                "gpt-5",
                "gpt-4o-mini",
                "gpt-4o",
                "gpt-3.5-turbo",
                { label: "Other", value: "custom" },
            ],
            defaultValue: "gpt-4o-mini",
            description: "Choose a common OpenAI model or select 'Other' to enter a custom one.",
            required: true,
            showWhen: {
                field: "provider",
                value: "openai"
            }
        }),
        openAICustomModel: textProperty({
            label: "Other Model",
            placeholder: "e.g., gpt-4.1-mini",
            description: "Specify the OpenAI model name",
            required: true,
            showWhen: [
                {
                    field: "provider",
                    value: "openai"
                },
                {
                    field: "openAIModel",
                    value: "custom"
                },
            ]
        }),
        openRouterModel: selectProperty({
            label: "Model",
            options: [
                "openai/gpt-4o-mini",
                "openai/gpt-4o",
                "openai/gpt-oss-120b:free",
                "anthropic/claude-3.5-sonnet",
                "google/gemini-2.0-flash-001",
                { label: "Other", value: "custom" },
            ],
            defaultValue: "openai/gpt-oss-120b:free",
            description: "Choose a common OpenRouter model or select 'Other' to enter a custom one.",
            required: true,
            showWhen: {
                field: "provider",
                value: "openrouter"
            }
        }),
        openRouterCustomModel: textProperty({
            label: "Other Model",
            placeholder: "e.g., mistralai/mistral-small-24b-instruct-2501",
            description: "Specify the OpenRouter model name. Check the [free models](https://openrouter.ai/collections/free-models)",
            required: true,
            showWhen: [
                {
                    field: "provider",
                    value: "openrouter"
                },
                {
                    field: "openRouterModel",
                    value: "custom"
                },
            ]
        }),
        prompt: textareaProperty({
            label: "Prompt",
            placeholder: "You are a helpful assistant. User input: {{get-content-node}}",
            description: "Use {{node-id}} to reference outputs from other actions",
            rows: 4,
            required: true
        }),
        maxTokens: numberProperty({
            label: "Max Tokens",
            placeholder: "1000",
            description: "Maximum number of tokens to generate (optional, uses model default if not set)",
            min: 1,
            max: 4000,
            required: false
        }),
        temperature: numberProperty({
            label: "Temperature",
            placeholder: "0.7",
            description: "Controls randomness (optional, uses model default if not set)",
            min: 0,
            max: 2,
            step: 0.1,
            required: false
        })
    }
},
  outputExample: {
    response: "This is a sample AI response to your prompt.",
    model: "openai/gpt-4o-mini",
    tokensUsed: 45,
},
} satisfies NodeDefinition;

export default definition;
