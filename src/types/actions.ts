import { BaseMetadata, BaseConfigurable } from "./base";
import {
  ConfigProperty,
  ConfigSchema,
  ValidationResult,
} from "./config-properties";
import { ExecutionContext } from "../services/workflow";

// Re-export for backward compatibility
export type ActionConfigProperty = ConfigProperty;
export type ActionConfigSchema = ConfigSchema;
export type ActionValidationResult = ValidationResult;

// Action-specific metadata extends base metadata
export interface ActionMetadata extends BaseMetadata {}

// Abstract base class for all actions
export abstract class BaseAction<
  TConfig = Record<string, any>,
> extends BaseConfigurable<TConfig> {
  abstract readonly metadata: ActionMetadata;

  // Execute the action
  abstract execute(
    config: TConfig,
    context: ExecutionContext,
    nodeId: string,
    onSuccess?: (data?: any) => void,
    onError?: (error: Error) => void,
  ): Promise<void>;
}
