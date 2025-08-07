import { WorkflowExecutionContext, WorkflowNode } from './workflow';
import { 
  ConfigProperty, 
  ConfigSchema, 
  ValidationResult, 
  validateConfig, 
  applyDefaults 
} from './config-properties';

// Re-export for backward compatibility
export type TriggerConfigProperty = ConfigProperty;
export type TriggerConfigSchema = ConfigSchema;
export type TriggerValidationResult = ValidationResult;

// Base trigger metadata
export interface TriggerMetadata {
  type: string;
  label: string;
  icon: string;
  description: string;
}

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
export abstract class BaseTrigger {
  abstract readonly metadata: TriggerMetadata;
  
  // Get the configuration schema for this trigger
  abstract getConfigSchema(): TriggerConfigSchema;
  
  // Get default configuration values
  abstract getDefaultConfig(): Record<string, any>;
  
  // Setup the trigger and return cleanup function
  abstract setup(
    config: Record<string, any>, 
    context: TriggerExecutionContext,
    onTrigger: () => Promise<void>
  ): Promise<TriggerSetupResult>;
  
  // Validate the configuration
  validate(config: Record<string, any>): TriggerValidationResult {
    return validateConfig(config, this.getConfigSchema());
  }
  
  // Get configuration with defaults applied
  getConfigWithDefaults(config: Record<string, any>): Record<string, any> {
    return applyDefaults(config, this.getConfigSchema(), this.getDefaultConfig());
  }
}