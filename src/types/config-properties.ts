import { ReactElement } from "react";

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
  type: "string";
  sensitive?: boolean; // For passwords, API keys etc.
}

export interface TextConfigProperty extends BaseConfigProperty {
  type: "text";
}

export interface TextareaConfigProperty extends BaseConfigProperty {
  type: "textarea";
  rows?: number;
}

export interface SelectConfigProperty extends BaseConfigProperty {
  type: "select";
  options: { value: string; label: string }[];
}

export interface NumberConfigProperty extends BaseConfigProperty {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
}

export interface BooleanConfigProperty extends BaseConfigProperty {
  type: "boolean";
}

export interface ColorConfigProperty extends BaseConfigProperty {
  type: "color";
}

export interface CodeConfigProperty extends BaseConfigProperty {
  type: "code";
  language?: string;
  height?: string | number;
}

export interface CustomConfigProperty extends BaseConfigProperty {
  type: "custom";
  render: (
    values: Record<string, any>,
    onChange: (key: string, value: any) => void,
  ) => ReactElement | null;
}

export interface CredentialsConfigProperty extends BaseConfigProperty {
  type: "credentials";
  credentialType?: string; // Updated to use credentialType instead of service
}

// Union type for all config properties
export type ConfigProperty =
  | StringConfigProperty
  | TextConfigProperty
  | TextareaConfigProperty
  | SelectConfigProperty
  | NumberConfigProperty
  | BooleanConfigProperty
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
export const isNumberProperty = (
  prop: ConfigProperty,
): prop is NumberConfigProperty => prop.type === "number";

export const isBooleanProperty = (
  prop: ConfigProperty,
): prop is BooleanConfigProperty => prop.type === "boolean";

export const isSelectProperty = (
  prop: ConfigProperty,
): prop is SelectConfigProperty => prop.type === "select";

export const isColorProperty = (
  prop: ConfigProperty,
): prop is ColorConfigProperty => prop.type === "color";

// Utility function to validate configuration
export function validateConfig(
  config: Record<string, any>,
  schema: ConfigSchema,
): ValidationResult {
  const errors: string[] = [];

  Object.entries(schema.properties).forEach(([key, property]) => {
    const value = config[key];
    console.log("Validating property:", key, value, property);

    // Check required properties
    if (
      property.required &&
      (value === undefined || value === null || value === "") &&
      !property.defaultValue
    ) {
      errors.push(`${property.label} is required`);
      return;
    }

    // Skip validation if value is empty and not required
    if (value === undefined || value === null || value === "") {
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
    } else if (isBooleanProperty(property)) {
      if (typeof value !== "boolean") {
        errors.push(`${property.label} must be a boolean value`);
      }
    } else if (isSelectProperty(property)) {
      if (!property.options.some((opt) => opt.value === value)) {
        errors.push(`${property.label} must be one of the available options`);
      }
    } else if (isColorProperty(property)) {
      // Validate hex color format (#RRGGBB or #RGB)
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(value)) {
        errors.push(
          `${property.label} must be a valid hex color (e.g., #FF0000 or #F00)`,
        );
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get type-based default value for a property
export function getTypeBasedDefault(property: ConfigProperty): any {
  switch (property.type) {
    case "string":
    case "text":
    case "textarea":
    case "code":
    case "credentials":
    case "custom":
      return "";
    case "number":
      return 0;
    case "boolean":
      return false;
    case "select":
      return property.options && property.options.length > 0
        ? property.options[0].value
        : "";
    case "color":
      return "#000000";
    default:
      return "";
  }
}

// Utility function to generate default config from schema
export function generateDefaultConfig(
  schema: ConfigSchema,
): Record<string, any> {
  const defaults: Record<string, any> = {};

  Object.entries(schema.properties).forEach(([key, property]) => {
    if (property.defaultValue !== undefined) {
      defaults[key] = property.defaultValue;
    } else if (property.required) {
      // Only apply type-based defaults for required fields
      defaults[key] = getTypeBasedDefault(property);
    } else {
      // Optional fields without explicit defaults should be undefined
      defaults[key] = undefined;
    }
  });

  return defaults;
}

// Utility function to apply defaults
export function applyDefaults(
  config: Record<string, any>,
  schema: ConfigSchema,
  classDefaults: Record<string, any> = {},
): Record<string, any> {
  const result = { ...classDefaults, ...config };

  Object.entries(schema.properties).forEach(([key, property]) => {
    const value = result[key];

    // For optional fields, treat empty strings as undefined
    const shouldApplyDefault =
      value === undefined || (!property.required && value === "");

    if (shouldApplyDefault) {
      if (property.defaultValue !== undefined) {
        result[key] = property.defaultValue;
      } else if (!property.required) {
        // For optional fields without explicit defaults, use undefined instead of type defaults
        result[key] = undefined;
      } else {
        result[key] = getTypeBasedDefault(property);
      }
    }
  });

  return result;
}
