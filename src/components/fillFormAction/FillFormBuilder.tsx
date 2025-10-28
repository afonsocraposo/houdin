import { ActionIcon, Center, Stack } from "@mantine/core";
import FillFormBuilderItem from "./FillFormBuilderItem";
import { IconPlus } from "@tabler/icons-react";

export type FillFormSelectorType =
  | "css"
  | "xpath"
  | "label"
  | "name"
  | "placeholder";

export interface FillFormFieldDefinition {
  selectorType: FillFormSelectorType;
  selector: string;
  value: string;
}

interface FillFormBuilderProps {
  fields: FillFormFieldDefinition[];
  onChange: (key: string, value: any) => void;
}

export default function FillFormBuilder({
  fields,
  onChange,
}: FillFormBuilderProps) {
  const handleNewField = () => {
    const newField: FillFormFieldDefinition = {
      selectorType: "css",
      selector: "",
      value: "",
    };
    onChange("fields", [...fields, newField]);
  };
  const handleItemChange = (
    index: number,
    updatedField: FillFormFieldDefinition,
  ) => {
    const updatedFields = [...fields];
    updatedFields[index] = updatedField;
    onChange("fields", updatedFields);
  };
  const handleDeleteItem = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    onChange("fields", updatedFields);
  };
  return (
    <Stack align="stretch">
      {fields.map((field, index) => (
        <FillFormBuilderItem
          key={index}
          item={field}
          onChange={(updated) => handleItemChange(index, updated)}
          onDelete={() => handleDeleteItem(index)}
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
