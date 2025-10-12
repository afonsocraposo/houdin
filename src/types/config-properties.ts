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
export interface TextConfigProperty extends BaseConfigProperty {
  type: "text";
}

export interface PasswordConfigProperty extends BaseConfigProperty {
  type: "password";
}

export interface TextareaConfigProperty extends BaseConfigProperty {
  type: "textarea";
  rows?: number;
}

export interface SelectConfigProperty extends BaseConfigProperty {
  type: "select";
  options: { value: string; label: string }[] | string[];
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
  | TextConfigProperty
  | PasswordConfigProperty
  | TextareaConfigProperty
  | SelectConfigProperty
  | NumberConfigProperty
  | BooleanConfigProperty
  | ColorConfigProperty
  | CodeConfigProperty
  | CustomConfigProperty
  | CredentialsConfigProperty;

// Schema definition
export interface ConfigSchema<TConfig = Record<string, any>> {
  properties: Record<keyof TConfig, ConfigProperty>;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
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
  const errors: Record<string, string[]> = {};

  Object.entries(schema.properties).forEach(([key, property]) => {
    const value = config[key];
    const propertyErrors: string[] = [];

    // Check required properties
    if (
      property.required &&
      (value === undefined || value === null || value === "") &&
      !property.defaultValue
    ) {
      propertyErrors.push(`${property.label} is required`);
      errors[key] = propertyErrors;
      return;
    }

    // Skip validation if value is empty and not required
    if (value === undefined || value === null || value === "") {
      return;
    }

    // Type-specific validation
    if (isNumberProperty(property)) {
      if (isNaN(Number(value))) {
        propertyErrors.push(`${property.label} must be a number`);
      } else {
        const num = Number(value);
        if (property.min !== undefined && num < property.min) {
          propertyErrors.push(
            `${property.label} must be at least ${property.min}`,
          );
        }
        if (property.max !== undefined && num > property.max) {
          propertyErrors.push(
            `${property.label} must be at most ${property.max}`,
          );
        }
      }
    } else if (isBooleanProperty(property)) {
      if (typeof value !== "boolean") {
        propertyErrors.push(`${property.label} must be a boolean value`);
      }
    } else if (isSelectProperty(property)) {
      if (
        !property.options.some((opt) =>
          opt instanceof Object ? opt.value === value : opt === value,
        )
      ) {
        propertyErrors.push(
          `${property.label} must be one of the available options`,
        );
      }
    } else if (isColorProperty(property)) {
      // Validate hex color format (#RRGGBB or #RGB)
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(value)) {
        propertyErrors.push(
          `${property.label} must be a valid hex color (e.g., #FF0000 or #F00)`,
        );
      }
    }
    if (propertyErrors.length > 0) {
      errors[key] = propertyErrors;
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// Get type-based default value for a property
export function getTypeBasedDefault(property: ConfigProperty): any {
  switch (property.type) {
    case "text":
    case "password":
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
      if (!property.options || property.options.length === 0) return "";
      if (property.options[0] instanceof Object) {
        return property.options[0].value;
      }
      return property.options[0];
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

// Constructor functions for config property types
export function textProperty(
  config: Omit<TextConfigProperty, "type">,
): TextConfigProperty {
  return { type: "text", ...config };
}

export function passwordProperty(
  config: Omit<PasswordConfigProperty, "type">,
): PasswordConfigProperty {
  return { type: "password", ...config };
}

export function textareaProperty(
  config: Omit<TextareaConfigProperty, "type">,
): TextareaConfigProperty {
  return { type: "textarea", ...config };
}

export function selectProperty(
  config: Omit<SelectConfigProperty, "type">,
): SelectConfigProperty {
  return { type: "select", ...config };
}

export function numberProperty(
  config: Omit<NumberConfigProperty, "type">,
): NumberConfigProperty {
  return { type: "number", ...config };
}

export function booleanProperty(
  config: Omit<BooleanConfigProperty, "type">,
): BooleanConfigProperty {
  return { type: "boolean", ...config };
}

export function colorProperty(
  config: Omit<ColorConfigProperty, "type">,
): ColorConfigProperty {
  return { type: "color", ...config };
}

export function codeProperty(
  config: Omit<CodeConfigProperty, "type">,
): CodeConfigProperty {
  return { type: "code", ...config };
}

export function customProperty(
  config: Omit<CustomConfigProperty, "type">,
): CustomConfigProperty {
  return { type: "custom", ...config };
}

export function credentialsProperty(
  config: Omit<CredentialsConfigProperty, "type">,
): CredentialsConfigProperty {
  return { type: "credentials", ...config };
}
