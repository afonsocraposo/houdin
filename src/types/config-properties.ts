import { ReactElement } from 'react';

// Base configuration property with common fields
interface BaseConfigProperty {
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  showWhen?: {
    field: string;
    value: string | string[];
  };
}

// Specific property types using discriminated unions
export interface StringConfigProperty extends BaseConfigProperty {
  type: 'string';
  sensitive?: boolean; // For passwords, API keys etc.
}

export interface TextConfigProperty extends BaseConfigProperty {
  type: 'text';
}

export interface TextareaConfigProperty extends BaseConfigProperty {
  type: 'textarea';
  rows?: number;
}

export interface SelectConfigProperty extends BaseConfigProperty {
  type: 'select';
  options: { value: string; label: string }[];
}

export interface NumberConfigProperty extends BaseConfigProperty {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
}

export interface ColorConfigProperty extends BaseConfigProperty {
  type: 'color';
}

export interface CodeConfigProperty extends BaseConfigProperty {
  type: 'code';
  language?: string;
  height?: string | number;
}

export interface CustomConfigProperty extends BaseConfigProperty {
  type: 'custom';
  render: (values: Record<string, any>, onChange: (key: string, value: any) => void) => ReactElement | null;
}

export interface CredentialsConfigProperty extends BaseConfigProperty {
  type: 'credentials';
  credentialType?: string; // Updated to use credentialType instead of service
}

// Union type for all config properties
export type ConfigProperty =
  | StringConfigProperty
  | TextConfigProperty
  | TextareaConfigProperty
  | SelectConfigProperty
  | NumberConfigProperty
  | ColorConfigProperty
  | CodeConfigProperty
  | CustomConfigProperty
  | CredentialsConfigProperty;

// Schema definition
export interface ConfigSchema {
  properties: Record<string, ConfigProperty>;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Type guards for runtime type checking
export const isStringProperty = (prop: ConfigProperty): prop is StringConfigProperty =>
  prop.type === 'string';

export const isTextProperty = (prop: ConfigProperty): prop is TextConfigProperty =>
  prop.type === 'text';

export const isTextareaProperty = (prop: ConfigProperty): prop is TextareaConfigProperty =>
  prop.type === 'textarea';

export const isSelectProperty = (prop: ConfigProperty): prop is SelectConfigProperty =>
  prop.type === 'select';

export const isNumberProperty = (prop: ConfigProperty): prop is NumberConfigProperty =>
  prop.type === 'number';

export const isColorProperty = (prop: ConfigProperty): prop is ColorConfigProperty =>
  prop.type === 'color';

export const isCodeProperty = (prop: ConfigProperty): prop is CodeConfigProperty =>
  prop.type === 'code';

export const isCustomProperty = (prop: ConfigProperty): prop is CustomConfigProperty =>
  prop.type === 'custom';

export const isCredentialsProperty = (prop: ConfigProperty): prop is CredentialsConfigProperty =>
  prop.type === 'credentials';

// Utility function to validate configuration
export function validateConfig(config: Record<string, any>, schema: ConfigSchema): ValidationResult {
  const errors: string[] = [];
  
  Object.entries(schema.properties).forEach(([key, property]) => {
    const value = config[key];
    
    // Check required properties
    if (property.required && (value === undefined || value === null || value === '')) {
      errors.push(`${property.label} is required`);
      return;
    }
    
    // Skip validation if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return;
    }
    
    // Type-specific validation
    if (isNumberProperty(property)) {
      if (isNaN(Number(value))) {
        errors.push(`${property.label} must be a number`);
      } else {
        const num = Number(value);
        if (property.min !== undefined && num < property.min) {
          errors.push(`${property.label} must be at least ${property.min}`);
        }
        if (property.max !== undefined && num > property.max) {
          errors.push(`${property.label} must be at most ${property.max}`);
        }
      }
    } else if (isSelectProperty(property)) {
      if (!property.options.some(opt => opt.value === value)) {
        errors.push(`${property.label} must be one of the available options`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Utility function to apply defaults
export function applyDefaults(config: Record<string, any>, schema: ConfigSchema, classDefaults: Record<string, any> = {}): Record<string, any> {
  const result = { ...classDefaults, ...config };
  
  Object.entries(schema.properties).forEach(([key, property]) => {
    if (result[key] === undefined && property.defaultValue !== undefined) {
      result[key] = property.defaultValue;
    }
  });
  
  return result;
}