import { WorkflowExecutionContext } from "./workflow";
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
export interface ActionMetadata extends BaseMetadata {}

// Extended execution context that includes workflow info
export interface ActionExecutionContext extends WorkflowExecutionContext {
  workflowId?: string;
}

// Abstract base class for all actions
export abstract class BaseAction<
  TConfig = Record<string, any>,
> extends BaseConfigurable<TConfig> {
  abstract readonly metadata: ActionMetadata;

  // Execute the action
  abstract execute(
    config: TConfig,
    context: ActionExecutionContext,
    nodeId: string,
  ): Promise<void>;
}
