import { BaseMetadata, BaseConfigurable } from "./base";
import {
  ConfigProperty,
  ConfigSchema,
  ValidationResult,
} from "./config-properties";

// Re-export for backward compatibility
export type TriggerConfigProperty = ConfigProperty;
export type TriggerConfigSchema = ConfigSchema;
export type TriggerValidationResult = ValidationResult;

// Trigger metadata is the same as base metadata
export type TriggerMetadata = BaseMetadata & {};

// Trigger setup result interface
export interface TriggerSetupResult {
  cleanup?: () => void; // Function to clean up resources (observers, timeouts, etc.)
}

// Abstract base class for all triggers
export abstract class BaseTrigger<
  TConfig = Record<string, any>,
> extends BaseConfigurable<TConfig> {
  abstract readonly metadata: TriggerMetadata;

  // Setup the trigger and return cleanup function
  abstract setup(
    config: TConfig,
    workflowId: string,
    nodeId: string,
    onTrigger: (data?: any) => Promise<void>,
  ): Promise<void>;
}
