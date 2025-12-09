import React from "react";
import {
  Stack,
  TextInput,
  Select,
  NumberInput,
  ColorInput,
  InputLabel,
  Text,
  Switch,
} from "@mantine/core";
import { ConfigSchema, ConfigProperty } from "@/types/config-properties";
import { CredentialsSelect } from "@/components/CredentialsSelect";
import PasswordInput from "@/components/PasswordInput";
import MaximizableTextArea from "./ModalTextArea";
import MaximizableCodeInput from "./ModalCodeInput";

interface SchemaBasedPropertiesProps {
  defaultConfig?: Record<string, any>;
  schema: ConfigSchema;
  values: Record<string, any>;
  onChange: (path: string, value: any) => void;
  errors?: Record<string, string[]>;
}

export const SchemaBasedProperties: React.FC<SchemaBasedPropertiesProps> = ({
  defaultConfig = {},
  schema,
  values,
  onChange,
  errors = {},
}) => {
  // Check if a property should be shown based on showWhen condition
  const shouldShowProperty = (property: ConfigProperty): boolean => {
    if (!property.showWhen) return true;

    const { field, value: conditionValue } = property.showWhen;
    const fieldValue = values[field];

    if (Array.isArray(conditionValue)) {
      return conditionValue.includes(fieldValue);
    }

    return fieldValue === conditionValue;
  };

  const renderProperty = (
    key: string,
    property: ConfigProperty,
    errors: string[],
  ) => {
    const errorMessage = errors && errors.length > 0 ? errors[0] : null;
    const value = values[key] ?? property.defaultValue ?? "";

    switch (property.type) {
      case "text":
        return (
          <TextInput
            label={property.label}
            placeholder={property.placeholder}
            description={property.description}
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
            required={property.required}
            error={errorMessage}
          />
        );
      case "password":
        return (
          <PasswordInput
            label={property.label}
            placeholder={property.placeholder}
            description={property.description}
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
            required={property.required}
            error={errorMessage}
          />
        );
      case "textarea":
        return (
          <MaximizableTextArea
            label={property.label}
            placeholder={property.placeholder}
            description={property.description}
            minRows={property.rows || 3}
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
            required={property.required}
            error={errorMessage}
          />
        );

      case "select":
        return (
          <Select
            label={property.label}
            placeholder={property.placeholder}
            description={property.description}
            data={property.options || []}
            value={value}
            onChange={(val) => onChange(key, val)}
            required={property.required}
            error={errorMessage}
          />
        );

      case "number":
        return (
          <NumberInput
            label={property.label}
            placeholder={property.placeholder}
            description={property.description}
            min={property.min}
            max={property.max}
            step={property.step}
            value={value}
            onChange={(val) => onChange(key, val)}
            required={property.required}
            error={errorMessage}
          />
        );

      case "color":
        // Handle color with optional "Default" option
        return (
          <ColorInput
            closeOnColorSwatchClick
            label={property.label}
            placeholder={property.placeholder}
            description={property.description}
            format="hex"
            swatches={[
              "#2e2e2e",
              "#868e96",
              "#fa5252",
              "#e64980",
              "#be4bdb",
              "#7950f2",
              "#4c6ef5",
              "#228be6",
              "#15aabf",
              "#12b886",
              "#40c057",
              "#82c91e",
              "#fab005",
              "#fd7e14",
            ]}
            value={value}
            onChange={(val) => onChange(key, val)}
            required={property.required}
            error={errorMessage}
          />
        );

      case "code":
        return (
          <MaximizableCodeInput
            key={key}
            label={property.label}
            placeholder={property.placeholder}
            description={property.description}
            language={property.language}
            height={property.height}
            value={value}
            onChange={(val) => onChange(key, val)}
            required={property.required}
            error={errorMessage}
          />
        );

      case "boolean":
        return (
          <Switch
            label={property.label}
            description={property.description}
            // labelPosition="left"
            checked={Boolean(value)}
            onChange={(e) => onChange(key, e.currentTarget.checked)}
            error={errorMessage}
          />
        );

      case "credentials":
        return (
          <>
            <CredentialsSelect
              label={property.label}
              placeholder={property.placeholder}
              description={property.description}
              value={value}
              onChange={(val) => onChange(key, val)}
              required={property.required}
              credentialType={property.credentialType}
              houdin={property.houdin}
            />
            {errorMessage && (
              <Text size="xs" c="red" mt="xs">
                {errorMessage}
              </Text>
            )}
          </>
        );
      case "custom":
        // merge default config with current values
        Object.keys(defaultConfig).forEach((configKey) => {
          if (values[configKey] === undefined) {
            values[configKey] = defaultConfig[configKey];
          }
        });
        return (
          <div>
            <InputLabel mb="xs">{property.label}</InputLabel>
            {property.render(values, onChange)}
            {errorMessage && (
              <Text size="xs" c="red" mt="xs">
                {errorMessage}
              </Text>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Stack gap="md">
      {Object.entries(schema.properties)
        .filter(([, property]) => shouldShowProperty(property))
        .map(([key, property]) => (
          <div key={key}>{renderProperty(key, property, errors[key])}</div>
        ))}
    </Stack>
  );
};
