export interface Credential {
  id: string;
  name: string;
  type: 'api_key' | 'bearer_token' | 'basic_auth' | 'custom';
  service: 'openai' | 'anthropic' | 'google_ai' | 'azure_openai' | 'custom';
  description?: string;
  value: string;
  username?: string; // for basic auth
  createdAt: number;
  updatedAt: number;
}

// OpenAI-specific credential interface
export interface OpenAICredential extends Credential {
  service: 'openai';
  type: 'api_key';
  organizationId?: string; // Optional OpenAI organization ID
}

export interface CredentialConfig {
  credentials: Credential[];
}