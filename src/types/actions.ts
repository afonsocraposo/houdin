import { BaseMetadata, BaseConfigurable } from "./base";
import {
  ConfigProperty,
  ConfigSchema,
  ValidationResult,
} from "./config-properties";

// Re-export for backward compatibility
export type ActionConfigProperty = ConfigProperty;
export type ActionConfigSchema = ConfigSchema;
export type ActionValidationResult = ValidationResult;

// Action-specific metadata extends base metadata
export interface ActionMetadata extends BaseMetadata {
  disableTimeout?: boolean; // Whether to disable timeout for this action
}

// Abstract base class for all actions
export abstract class BaseAction<
  TConfig = Record<string, any>,
  TOutput = Record<string, any>,
> extends BaseConfigurable<TConfig> {
  abstract readonly metadata: ActionMetadata;
  abstract readonly outputExample: TOutput;

  // Execute the action
  abstract execute(
    config: TConfig,
    workflowId: string,
    nodeId: string,
    onSuccess: (data?: TOutput) => void,
    onError: (error: Error) => void,
    tabId?: number,
  ): Promise<void>;
}
