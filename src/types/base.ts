import {
  ConfigSchema,
  ValidationResult,
  validateConfig,
  applyDefaults,
  generateDefaultConfig,
} from "./config-properties";
import { ComponentType } from "react";

// Common metadata interface that all registrable types share
export interface BaseMetadata {
  type: string;
  label: string;
  icon: string | ComponentType<any>;
  description: string;
}

// Abstract base class for all configurable types (actions, triggers, credentials)
export abstract class BaseConfigurable<TConfig = Record<string, any>> {
  static readonly metadata: BaseMetadata;
  public get metadata(): BaseMetadata {
    return (this.constructor as typeof BaseConfigurable).metadata;
  }

  // Get the configuration schema
  static readonly configSchema: ConfigSchema;
  public get configSchema(): ConfigSchema<TConfig> {
    return (this.constructor as typeof BaseConfigurable)
      .configSchema as ConfigSchema<TConfig>;
  }

  // Get default configuration values (defaults to schema defaults)
  getDefaultConfig(): TConfig {
    return generateDefaultConfig(this.configSchema) as TConfig;
  }

  // Validate the configuration
  validate(config: Record<string, any>): ValidationResult {
    return validateConfig(config, this.configSchema);
  }

  // Get configuration with defaults applied
  getConfigWithDefaults(config: Record<string, any>): TConfig {
    const defaults = this.getDefaultConfig();
    return applyDefaults(
      config,
      this.configSchema,
      defaults as Record<string, any>,
    ) as TConfig;
  }
}
