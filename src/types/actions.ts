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
  outputs?: Set<string>; // Available output handles for multiple outputs
  hidden?: boolean;
}

// Abstract base class for all actions
export abstract class BaseAction<
  TConfig = Record<string, any>,
  TOutput = Record<string, any>,
> extends BaseConfigurable<TConfig> {
  static metadata?: ActionMetadata;
  static configSchema?: ConfigSchema;
  static outputExample?: unknown;

  constructor(definition: {
    metadata: ActionMetadata;
    configSchema: ConfigSchema;
    outputExample: TOutput;
  }) {
    super(definition);
  }

  public get outputExample(): TOutput {
    return (
      (super.outputExample as TOutput) ??
      (this.constructor as typeof BaseAction & { outputExample?: TOutput })
        .outputExample!
    );
  }

  // Execute the action
  abstract execute(
    config: TConfig,
    workflowId: string,
    nodeId: string,
    onSuccess: (data?: TOutput, outputHandle?: string) => void,
    onError: (error: Error) => void,
    tabId?: number,
  ): Promise<void>;
}
