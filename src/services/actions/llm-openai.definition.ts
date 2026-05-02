import type { NodeDefinition } from '../node-definitions/types';
import { credentialsProperty, numberProperty, selectProperty, textProperty, textareaProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "llm-openai",
    label: "OpenAI (legacy)",
    icon: "IconBrandOpenai",
    description: "Legacy OpenAI action kept for older workflows",
    disableTimeout: true
},
  configSchema: {
    properties: {
        credentialId: credentialsProperty({
            credentialType: "openai",
            label: "OpenAI Credential",
            placeholder: "Select an OpenAI API key",
            description: "Choose the OpenAI API credential to use or pick 'Houdin Plus' if you're subscribed",
            required: true,
            houdin: true
        }),
        model: selectProperty({
            label: "Model",
            options: [
                { label: "gpt-5", value: "gpt-5" },
                { label: "gpt-4o-mini", value: "gpt-4o-mini" },
                { label: "gpt-4o", value: "gpt-4o" },
                { label: "gpt-3.5-turbo", value: "gpt-3.5-turbo" },
                { label: "gpt-3.5-turbo-16k", value: "gpt-3.5-turbo-16k" },
                { label: "Other", value: "custom" },
            ],
            defaultValue: "gpt-4o-mini"
        }),
        customModel: textProperty({
            label: "Other Model",
            placeholder: "e.g., gpt-4-turbo",
            description: "Specify the model name",
            showWhen: {
                field: "model",
                value: "custom"
            }
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
    model: "gpt-4o-mini",
    tokensUsed: 45,
},
} satisfies NodeDefinition;

export default definition;
