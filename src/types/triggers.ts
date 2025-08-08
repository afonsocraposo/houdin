import { WorkflowExecutionContext, WorkflowNode } from './workflow';
import { 
  ConfigProperty, 
  ConfigSchema, 
  ValidationResult, 
  validateConfig, 
  applyDefaults,
  generateDefaultConfig
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
export abstract class BaseTrigger<TConfig = Record<string, any>> {
  abstract readonly metadata: TriggerMetadata;
  
  // Get the configuration schema for this trigger
  abstract getConfigSchema(): TriggerConfigSchema;
  
  // Get default configuration values (now optional - defaults to schema defaults)
  getDefaultConfig(): TConfig {
    return generateDefaultConfig(this.getConfigSchema()) as TConfig;
  }
  
  // Setup the trigger and return cleanup function
  abstract setup(
    config: TConfig, 
    context: TriggerExecutionContext,
    onTrigger: () => Promise<void>
  ): Promise<TriggerSetupResult>;
  
  // Validate the configuration
  validate(config: Record<string, any>): TriggerValidationResult {
    return validateConfig(config, this.getConfigSchema());
  }
  
  // Get configuration with defaults applied
  getConfigWithDefaults(config: Record<string, any>): TConfig {
    const defaults = this.getDefaultConfig();
    return applyDefaults(config, this.getConfigSchema(), defaults as Record<string, any>) as TConfig;
  }
}