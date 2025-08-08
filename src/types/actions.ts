import { WorkflowExecutionContext } from './workflow';
import { 
  ConfigProperty, 
  ConfigSchema, 
  ValidationResult, 
  validateConfig, 
  applyDefaults,
  generateDefaultConfig
} from './config-properties';

// Re-export for backward compatibility
export type ActionConfigProperty = ConfigProperty;
export type ActionConfigSchema = ConfigSchema;
export type ActionValidationResult = ValidationResult;

// Base action metadata
export interface ActionMetadata {
  type: string;
  label: string;
  icon: string;
  description: string;
  completion?: boolean; // Whether this action triggers connected actions after completion
}

// Extended execution context that includes workflow info
export interface ActionExecutionContext extends WorkflowExecutionContext {
  workflowId?: string;
}

// Abstract base class for all actions
export abstract class BaseAction<TConfig = Record<string, any>> {
  abstract readonly metadata: ActionMetadata;
  
  // Get the configuration schema for this action
  abstract getConfigSchema(): ActionConfigSchema;
  
  // Get default configuration values (now optional - defaults to schema defaults)
  getDefaultConfig(): TConfig {
    return generateDefaultConfig(this.getConfigSchema()) as TConfig;
  }
  
  // Execute the action
  abstract execute(
    config: TConfig, 
    context: ActionExecutionContext, 
    nodeId: string
  ): Promise<void>;
  
  // Validate the configuration
  validate(config: Record<string, any>): ActionValidationResult {
    return validateConfig(config, this.getConfigSchema());
  }
  
  // Get configuration with defaults applied
  getConfigWithDefaults(config: Record<string, any>): TConfig {
    const defaults = this.getDefaultConfig();
    return applyDefaults(config, this.getConfigSchema(), defaults as Record<string, any>) as TConfig;
  }
}