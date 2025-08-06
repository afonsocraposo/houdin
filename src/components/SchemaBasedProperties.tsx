import React from "react";
import {
    Stack,
    TextInput,
    Select,
    Textarea,
    NumberInput,
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
    const renderProperty = (key: string, property: ActionConfigProperty) => {
        const value = values[key] ?? property.defaultValue ?? '';

        switch (property.type) {
            case 'text':
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

            case 'textarea':
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

            case 'select':
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

            case 'number':
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

            default:
                return null;
        }
    };

    return (
        <Stack gap="md">
            {Object.entries(schema.properties).map(([key, property]) =>
                renderProperty(key, property)
            )}
        </Stack>
    );
};