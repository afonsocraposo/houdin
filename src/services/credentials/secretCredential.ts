import { BaseCredential, CredentialMetadata } from "@/types/credentials";
import { ConfigSchema } from "@/types/config-properties";

interface SecretConfig {
  secretValue: string;
}

interface SecretAuth {
  value: string;
}

export class SecretCredential extends BaseCredential<SecretConfig, SecretAuth> {
  readonly metadata: CredentialMetadata = {
    type: "secret",
    label: "Secret/Token",
    icon: "IconKey",
    description: "Generic secret storage for API keys, tokens, passwords, etc.",
  };

  getConfigSchema(): ConfigSchema {
    return {
      properties: {
        secretValue: {
          type: "string",
          label: "Secret Value",
          description: "The actual secret value (API key, token, password, etc.)",
          required: true,
          sensitive: true,
          placeholder: "Enter your secret value...",
        },
      },
    };
  }

  getAuth(config: SecretConfig): SecretAuth {
    return {
      value: config.secretValue,
    };
  }
}
