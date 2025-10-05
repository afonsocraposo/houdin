import { BaseCredential, CredentialMetadata } from "@/types/credentials";
import { passwordProperty } from "@/types/config-properties";

interface SecretConfig {
  secretValue: string;
}

interface SecretAuth {
  value: string;
}

export class SecretCredential extends BaseCredential<SecretConfig, SecretAuth> {
  static readonly metadata: CredentialMetadata = {
    type: "secret",
    label: "Secret/Token",
    icon: "IconKey",
    description: "Generic secret storage for API keys, tokens, passwords, etc.",
  };

  configSchema = {
    properties: {
      secretValue: passwordProperty({
        label: "Secret Value",
        description: "The actual secret value (API key, token, password, etc.)",
        required: true,
        placeholder: "Enter your secret value...",
      }),
    },
  };

  getAuth(config: SecretConfig): SecretAuth {
    return {
      value: config.secretValue,
    };
  }
}
