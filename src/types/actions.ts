import { WorkflowExecutionContext } from './workflow';
import { ReactElement } from 'react';

// Configuration property types for action schemas
export interface ActionConfigProperty {
  type: 'text' | 'textarea' | 'select' | 'number' | 'color' | 'custom';
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
  
  // For color type
  allowDefault?: boolean; // If true, includes "Default" option
  
  // For custom type
  render?: (values: Record<string, any>) => ReactElement | null;
  
  // Conditional display
  showWhen?: {
    field: string;
    value: string | string[];
  };
}

// Custom section for schema
export interface ActionConfigCustomSection {
  id: string;
  render: (values: Record<string, any>) => ReactElement | null;
}

// Schema definition for action configuration
export interface ActionConfigSchema {
  properties: Record<string, ActionConfigProperty>;
}

// Validation result
export interface ActionValidationResult {
  valid: boolean;
  errors: string[];
}

// Base action metadata
export interface ActionMetadata {
  type: string;
  label: string;
  icon: string;
  description: string;
}

// Extended execution context that includes workflow info
export interface ActionExecutionContext extends WorkflowExecutionContext {
  workflowId?: string;
}

// Abstract base class for all actions
export abstract class BaseAction {
  abstract readonly metadata: ActionMetadata;
  
  // Get the configuration schema for this action
  abstract getConfigSchema(): ActionConfigSchema;
  
  // Get default configuration values
  abstract getDefaultConfig(): Record<string, any>;
  
  // Execute the action
  abstract execute(
    config: Record<string, any>, 
    context: ActionExecutionContext, 
    nodeId: string
  ): Promise<void>;
  
  // Validate the configuration
  validate(config: Record<string, any>): ActionValidationResult {
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