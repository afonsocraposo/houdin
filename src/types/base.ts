import {
  ConfigSchema,
  ValidationResult,
  validateConfig,
  applyDefaults,
  generateDefaultConfig,
} from "./config-properties";
import { ComponentType } from "react";
import type { NodeDefinition } from "@/services/node-definitions/types";

// Common metadata interface that all registrable types share
export interface BaseMetadata {
  type: string;
  label: string;
  icon: string | ComponentType<any>;
  description: string;
  disableTimeout?: boolean;
  outputs?: Set<string>;
  hidden?: boolean;
}

// Abstract base class for all configurable types (actions, triggers, credentials)
export abstract class BaseConfigurable<TConfig = Record<string, any>> {
  static metadata?: BaseMetadata;
  static configSchema?: ConfigSchema;
  static outputExample?: unknown;

  protected readonly definition?: Pick<
    NodeDefinition,
    "metadata" | "configSchema" | "outputExample"
  >;

  constructor(
    definition?: Pick<
      NodeDefinition,
      "metadata" | "configSchema" | "outputExample"
    >,
  ) {
    this.definition = definition;
    if (definition) {
      const ctor = this.constructor as typeof BaseConfigurable & {
        metadata?: BaseMetadata;
        configSchema?: ConfigSchema;
        outputExample?: unknown;
      };
      ctor.metadata = definition.metadata;
      ctor.configSchema = definition.configSchema;
      ctor.outputExample = definition.outputExample;
    }
  }

  public get metadata(): BaseMetadata {
    return (
      this.definition?.metadata ??
      (
        this.constructor as typeof BaseConfigurable & {
          metadata?: BaseMetadata;
        }
      ).metadata!
    );
  }

  // Get the configuration schema
  public get configSchema(): ConfigSchema<TConfig> {
    return (this.definition?.configSchema ??
      (
        this.constructor as typeof BaseConfigurable & {
          configSchema?: ConfigSchema;
        }
      ).configSchema) as ConfigSchema<TConfig>;
  }

  public get outputExample(): unknown {
    return (
      this.definition?.outputExample ??
      (
        this.constructor as typeof BaseConfigurable & {
          outputExample?: unknown;
        }
      ).outputExample
    );
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
