import { ActionIcon, Center, Stack } from "@mantine/core";
import FormBuilderItem from "./FormBuilderItem";
import { IconPlus } from "@tabler/icons-react";

export type FormFieldType =
  | "text"
  | "number"
  | "password"
  | "checkbox"
  | "select";
export interface FormFieldDefinition {
  name: string;
  label: string;
  type: FormFieldType | string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
  options?: string[]; // For select fields
}

interface FormBuilderProps {
  fields: FormFieldDefinition[];
  onChange: (key: string, value: any) => void;
}

export default function FormBuilder({ fields, onChange }: FormBuilderProps) {
  const handleNewField = () => {
    const newField: FormFieldDefinition = {
      name: `field_${fields.length + 1}`,
      label: `Field ${fields.length + 1}`,
      type: "text",
      required: false,
    };
    onChange("fields", [...fields, newField]);
  };
  const handleItemChange = (
    index: number,
    updatedField: FormFieldDefinition,
  ) => {
    const updatedFields = [...fields];
    updatedFields[index] = updatedField;
    onChange("fields", updatedFields);
  };
  return (
    <Stack align="stretch">
      {fields.map((field, index) => (
        <FormBuilderItem
          key={index}
          item={field}
          onChange={(updated) => handleItemChange(index, updated)}
        />
      ))}
      <Center mb="md">
        <ActionIcon onClick={handleNewField} variant="light">
          <IconPlus />
        </ActionIcon>
      </Center>
    </Stack>
  );
}
