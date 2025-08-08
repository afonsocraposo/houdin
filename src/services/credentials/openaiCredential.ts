import { BaseCredential, CredentialMetadata } from '../../types/credentials';
import { ConfigSchema } from '../../types/config-properties';

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
    type: 'openai',
    label: 'OpenAI API Key',
    icon: 'IconBrain',
    description: 'OpenAI API credentials for GPT models and other AI services'
  };

  getConfigSchema(): ConfigSchema {
    return {
      properties: {
        apiKey: {
          type: 'string',
          label: 'API Key',
          description: 'Your OpenAI API key',
          required: true,
          sensitive: true,
          placeholder: 'sk-...'
        },
        organizationId: {
          type: 'string',
          label: 'Organization ID',
          description: 'Optional OpenAI organization ID',
          required: false,
          placeholder: 'org-...'
        }
      }
    };
  }

  getDefaultConfig(): OpenAIConfig {
    return {
      apiKey: '',
      organizationId: ''
    };
  }

  getAuth(config: OpenAIConfig): OpenAIAuth {
    const auth: OpenAIAuth = {
      apiKey: config.apiKey
    };

    if (config.organizationId?.trim()) {
      auth.organizationId = config.organizationId;
    }

    return auth;
  }
}