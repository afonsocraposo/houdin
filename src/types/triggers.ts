import { WorkflowExecutionContext, WorkflowNode } from './workflow';
import { ReactElement } from 'react';

// Configuration property types for trigger schemas
export interface TriggerConfigProperty {
  type: 'text' | 'textarea' | 'select' | 'number' | 'color' | 'code' | 'custom';
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  
  // For select type
  options?: { value: string; label: string }[];
  
  // For number type
  min?: number;
  max?: number;
  step?: number;
  
  // For textarea
  rows?: number;
  
  // For code type
  language?: string; // Programming language for syntax highlighting (js, css, html, etc.)
  height?: string | number; // Editor height
  
  // For custom type
  render?: (values: Record<string, any>) => ReactElement | null;
  
  // Conditional display
  showWhen?: {
    field: string;
    value: string | string[];
  };
}

// Schema definition for trigger configuration
export interface TriggerConfigSchema {
  properties: Record<string, TriggerConfigProperty>;
}

// Validation result
export interface TriggerValidationResult {
  valid: boolean;
  errors: string[];
}

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
    const schema = this.getConfigSchema();
    const errors: string[] = [];
    
    // Check required properties
    Object.entries(schema.properties).forEach(([key, property]) => {
      if (property.required && !config[key]) {
        errors.push(`${property.label} is required`);
      }
      
      // Type validation
      if (config[key] !== undefined && config[key] !== null && config[key] !== '') {
        switch (property.type) {
          case 'number':
            if (isNaN(Number(config[key]))) {
              errors.push(`${property.label} must be a number`);
            } else {
              const num = Number(config[key]);
              if (property.min !== undefined && num < property.min) {
                errors.push(`${property.label} must be at least ${property.min}`);
              }
              if (property.max !== undefined && num > property.max) {
                errors.push(`${property.label} must be at most ${property.max}`);
              }
            }
            break;
            
          case 'select':
            if (property.options && !property.options.some(opt => opt.value === config[key])) {
              errors.push(`${property.label} must be one of the available options`);
            }
            break;
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  // Get configuration with defaults applied
  getConfigWithDefaults(config: Record<string, any>): Record<string, any> {
    const defaults = this.getDefaultConfig();
    const schema = this.getConfigSchema();
    const result = { ...defaults, ...config };
    
    // Apply property-level defaults
    Object.entries(schema.properties).forEach(([key, property]) => {
      if (result[key] === undefined && property.defaultValue !== undefined) {
        result[key] = property.defaultValue;
      }
    });
    
    return result;
  }
}