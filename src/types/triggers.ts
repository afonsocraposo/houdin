import { WorkflowExecutionContext, WorkflowNode } from './workflow';
import { BaseMetadata, BaseConfigurable } from './base';
import { 
  ConfigProperty, 
  ConfigSchema, 
  ValidationResult
} from './config-properties';

// Re-export for backward compatibility
export type TriggerConfigProperty = ConfigProperty;
export type TriggerConfigSchema = ConfigSchema;
export type TriggerValidationResult = ValidationResult;

// Trigger metadata is the same as base metadata
export type TriggerMetadata = BaseMetadata;

// Extended execution context that includes trigger info
export interface TriggerExecutionContext extends WorkflowExecutionContext {
  workflowId?: string;
  triggerNode: WorkflowNode;
}

// Trigger setup result interface
export interface TriggerSetupResult {
  cleanup?: () => void; // Function to clean up resources (observers, timeouts, etc.)
}

// Abstract base class for all triggers
export abstract class BaseTrigger<TConfig = Record<string, any>> extends BaseConfigurable<TConfig> {
  abstract readonly metadata: TriggerMetadata;
  
  // Setup the trigger and return cleanup function
  abstract setup(
    config: TConfig, 
    context: TriggerExecutionContext,
    onTrigger: () => Promise<void>
  ): Promise<TriggerSetupResult>;
}