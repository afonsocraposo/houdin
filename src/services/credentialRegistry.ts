import { ValidationResult } from "@/types/config-properties";
import { BaseCredential, CredentialMetadata } from "@/types/credentials";

export class CredentialRegistry {
  private static instance: CredentialRegistry;
  private credentials = new Map<string, BaseCredential>();

  private constructor() { }

  static getInstance(): CredentialRegistry {
    if (!CredentialRegistry.instance) {
      CredentialRegistry.instance = new CredentialRegistry();
    }
    return CredentialRegistry.instance;
  }

  // Register a new credential type
  register(credential: BaseCredential): void {
    this.credentials.set(credential.metadata.type, credential);
  }

  // Get credential by type
  getCredential(type: string): BaseCredential | undefined {
    return this.credentials.get(type);
  }

  // Get all registered credential types
  getAllCredentials(): BaseCredential[] {
    return Array.from(this.credentials.values());
  }

  // Get all credential metadata for UI
  getAllCredentialMetadata(): CredentialMetadata[] {
    return this.getAllCredentials().map((credential) => credential.metadata);
  }

  // Get authentication object from credential configuration
  getAuth(
    type: string,
    config: Record<string, any>,
  ): Record<string, any> | null {
    const credential = this.getCredential(type);
    if (!credential) {
      throw new Error(`Credential type '${type}' not found in registry`);
    }

    // Validate configuration before getting auth
    const validation = credential.validate(config);
    if (!validation.valid) {
      throw new Error(
        `Credential configuration invalid: ${JSON.stringify(validation.errors)}`,
      );
    }

    // Get auth with defaults applied
    const configWithDefaults = credential.getConfigWithDefaults(config);
    return credential.getAuth(configWithDefaults);
  }

  // Validate credential configuration
  validateConfig(type: string, config: Record<string, any>): ValidationResult {
    const credential = this.getCredential(type);
    if (!credential) {
      return {
        valid: false,
        errors: { "": [`Credential type '${type}' not found`] },
      };
    }

    return credential.validate(config);
  }

  // Get default configuration for a credential
  getDefaultConfig(type: string): Record<string, any> | null {
    const credential = this.getCredential(type);
    return credential ? credential.getDefaultConfig() : null;
  }

  // Get configuration schema for a credential
  getConfigSchema(type: string) {
    const credential = this.getCredential(type);
    return credential ? credential.getConfigSchema() : null;
  }

  // Check if credential type exists
  hasCredential(type: string): boolean {
    return this.credentials.has(type);
  }

  // Get credential categories for UI
  getCredentialCategories() {
    return {
      credentials: this.getAllCredentials().map((credential) => ({
        type: credential.metadata.type,
        label: credential.metadata.label,
        icon: credential.metadata.icon,
        description: credential.metadata.description,
      })),
    };
  }
}
