import { BaseCredential, CredentialMetadata } from "@/types/credentials";
import { passwordProperty, textProperty } from "@/types/config-properties";

interface OpenAIConfig {
  apiKey: string;
  organizationId?: string;
}

interface OpenAIAuth {
  apiKey: string;
  organizationId?: string;
}

export class OpenAICredential extends BaseCredential<OpenAIConfig, OpenAIAuth> {
  readonly metadata: CredentialMetadata = {
    type: "openai",
    label: "OpenAI API Key",
    icon: "IconBrain",
    description: "OpenAI API credentials for GPT models and other AI services",
  };

  configSchema = {
    properties: {
      apiKey: passwordProperty({
        label: "API Key",
        description: "Your OpenAI API key",
        required: true,
        placeholder: "sk-...",
        defaultValue: "",
      }),
      organizationId: textProperty({
        label: "Organization ID",
        description: "Optional OpenAI organization ID",
        required: false,
        placeholder: "org-...",
        defaultValue: "",
      }),
    },
  };
  getAuth(config: OpenAIConfig): OpenAIAuth {
    const auth: OpenAIAuth = {
      apiKey: config.apiKey,
    };

    if (config.organizationId?.trim()) {
      auth.organizationId = config.organizationId;
    }

    return auth;
  }
}
