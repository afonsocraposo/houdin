import {
  ConfigSchema,
  ValidationResult,
  validateConfig,
  applyDefaults,
  generateDefaultConfig,
} from "./config-properties";

export interface Credential {
  id: string;
  name: string;
  type: string; // Now uses credential type from registry
  description?: string;
  config: Record<string, any>; // Configuration values for this credential
  createdAt: number;
  updatedAt: number;
}

// Credential metadata for registry
export interface CredentialMetadata {
  type: string;
  label: string;
  icon: string;
  description: string;
}

// Abstract base class for all credential types
export abstract class BaseCredential<
  TConfig = Record<string, any>,
  TAuth = Record<string, any>,
> {
  abstract readonly metadata: CredentialMetadata;

  // Get the configuration schema for this credential type
  abstract getConfigSchema(): ConfigSchema;

  // Get default configuration values (now optional - defaults to schema defaults)
  getDefaultConfig(): TConfig {
    return generateDefaultConfig(this.getConfigSchema()) as TConfig;
  }

  // Get authentication object from configuration
  abstract getAuth(config: TConfig): TAuth;

  // Validate the configuration
  validate(config: Record<string, any>): ValidationResult {
    return validateConfig(config, this.getConfigSchema());
  }

  // Get configuration with defaults applied
  getConfigWithDefaults(config: Record<string, any>): TConfig {
    const defaults = this.getDefaultConfig();
    return applyDefaults(
      config,
      this.getConfigSchema(),
      defaults as Record<string, any>,
    ) as TConfig;
  }
}
