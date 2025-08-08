import { 
  ConfigSchema, 
  ValidationResult, 
  validateConfig, 
  applyDefaults,
  generateDefaultConfig
} from './config-properties';

// Common metadata interface that all registrable types share
export interface BaseMetadata {
  type: string;
  label: string;
  icon: string;
  description: string;
}

// Abstract base class for all configurable types (actions, triggers, credentials)
export abstract class BaseConfigurable<TConfig = Record<string, any>> {
  abstract readonly metadata: BaseMetadata;
  
  // Get the configuration schema
  abstract getConfigSchema(): ConfigSchema;
  
  // Get default configuration values (defaults to schema defaults)
  getDefaultConfig(): TConfig {
    return generateDefaultConfig(this.getConfigSchema()) as TConfig;
  }
  
  // Validate the configuration
  validate(config: Record<string, any>): ValidationResult {
    return validateConfig(config, this.getConfigSchema());
  }
  
  // Get configuration with defaults applied
  getConfigWithDefaults(config: Record<string, any>): TConfig {
    const defaults = this.getDefaultConfig();
    return applyDefaults(config, this.getConfigSchema(), defaults as Record<string, any>) as TConfig;
  }
}