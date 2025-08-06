import React from "react";
import {
  Stack,
  TextInput,
  Select,
  Textarea,
  NumberInput,
  ColorInput,
  InputLabel,
  Text,
} from "@mantine/core";
import { ActionConfigSchema, ActionConfigProperty } from "../types/actions";

interface SchemaBasedPropertiesProps {
  schema: ActionConfigSchema;
  values: Record<string, any>;
  onChange: (path: string, value: any) => void;
}

export const SchemaBasedProperties: React.FC<SchemaBasedPropertiesProps> = ({
  schema,
  values,
  onChange,
}) => {
  // Check if a property should be shown based on showWhen condition
  const shouldShowProperty = (property: ActionConfigProperty): boolean => {
    if (!property.showWhen) return true;

    const { field, value: conditionValue } = property.showWhen;
    const fieldValue = values[field];

    if (Array.isArray(conditionValue)) {
      return conditionValue.includes(fieldValue);
    }

    return fieldValue === conditionValue;
  };

  const renderProperty = (key: string, property: ActionConfigProperty) => {
    if (!shouldShowProperty(property)) {
      return null;
    }

    const value = values[key] ?? property.defaultValue ?? "";

    switch (property.type) {
      case "text":
        return (
          <TextInput
            key={key}
            label={property.label}
            placeholder={property.placeholder}
            description={property.description}
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
            required={property.required}
          />
        );

      case "textarea":
        return (
          <Textarea
            key={key}
            label={property.label}
            placeholder={property.placeholder}
            description={property.description}
            rows={property.rows || 3}
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
            required={property.required}
          />
        );

      case "select":
        return (
          <Select
            key={key}
            label={property.label}
            placeholder={property.placeholder}
            description={property.description}
            data={property.options || []}
            value={value}
            onChange={(val) => onChange(key, val)}
            required={property.required}
          />
        );

      case "number":
        return (
          <NumberInput
            key={key}
            label={property.label}
            placeholder={property.placeholder}
            description={property.description}
            min={property.min}
            max={property.max}
            step={property.step}
            value={value}
            onChange={(val) => onChange(key, val)}
            required={property.required}
          />
        );

      case "color":
        // Handle color with optional "Default" option
        return (
          <ColorInput
            closeOnColorSwatchClick
            key={key}
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
          />
        );

      case "custom":
        return property.render ? (
          <div key={key}>
            <InputLabel mb="xs">{property.label}</InputLabel>
            <br />
            {property.render(values)}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Stack gap="md">
      {Object.entries(schema.properties).map(([key, property]) =>
        renderProperty(key, property),
      )}
    </Stack>
  );
};
