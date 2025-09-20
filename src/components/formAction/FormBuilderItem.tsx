import {
  ActionIcon,
  Box,
  Card,
  Checkbox,
  Group,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { FormFieldDefinition, FormFieldType } from "./FormBuilder";
import { IconArrowDown, IconArrowUp, IconTrash } from "@tabler/icons-react";
import PasswordInput from "../PasswordInput";

interface FormBuilderItemProps {
  item: FormFieldDefinition;
  onChange: (updatedItem: FormFieldDefinition) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}
export default function FormBuilderItem({
  item,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: FormBuilderItemProps) {
  return (
    <Card pos="relative">
      <Stack>
        <TextInput
          label="Name"
          value={item.name}
          onChange={(e) => {
            const value = e.currentTarget.value;
            // check if it matches pattern
            if (!/^[a-zA-Z_]*$/.test(value)) {
              return;
            }
            onChange({ ...item, name: value });
          }}
        />
        <TextInput
          label="Label"
          value={item.label}
          onChange={(e) => onChange({ ...item, label: e.currentTarget.value })}
        />
        <Select
          label="Type"
          value={item.type}
          data={["text", "number", "password", "checkbox", "select"]}
          onChange={(value) =>
            onChange({
              ...item,
              defaultValue: undefined,
              type: value as FormFieldType,
            })
          }
        />
        {(item.type === "text" || item.type === "number") && (
          <TextInput
            label="Placeholder"
            value={item.placeholder}
            onChange={(e) =>
              onChange({ ...item, placeholder: e.currentTarget.value })
            }
          />
        )}
        {item.type === "select" && (
          <TextInput
            label="Options (comma separated)"
            value={item.options?.join(", ")}
            onChange={(e) =>
              onChange({
                ...item,
                options: e.currentTarget.value
                  .split(",")
                  .map((opt) => opt.trim()),
              })
            }
          />
        )}
        <ItemDefaultValue
          type={item.type}
          value={item.defaultValue}
          onChange={(value) => onChange({ ...item, defaultValue: value })}
        />
        <Checkbox
          label="Required"
          checked={item.required}
          onChange={(e) =>
            onChange({ ...item, required: e.currentTarget.checked })
          }
        />
      </Stack>
      <Box pos="absolute" top={10} right={10}>
        <Group>
          <ActionIcon onClick={onMoveUp} size="xs" variant="subtle">
            <IconArrowUp />
          </ActionIcon>
          <ActionIcon onClick={onMoveDown} size="xs" variant="subtle">
            <IconArrowDown />
          </ActionIcon>
          <ActionIcon color="red" onClick={onDelete} size="xs" variant="subtle">
            <IconTrash />
          </ActionIcon>
        </Group>
      </Box>
    </Card>
  );
}

function ItemDefaultValue({
  type,
  value,
  onChange,
}: {
  type: FormFieldType;
  value: any;
  onChange: (value: any) => void;
}) {
  switch (type) {
    case "text":
      return (
        <TextInput
          label="Default Value"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
      );
    case "password":
      return (
        <PasswordInput
          label="Default Value"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
      );
    case "number":
      return (
        <NumberInput
          label="Default Value"
          value={value !== undefined ? String(value) : ""}
          onChange={(val) => onChange(val)}
        />
      );
    case "checkbox":
      return (
        <Checkbox
          label="Default Checked"
          checked={value}
          onChange={(e) => onChange(e.currentTarget.checked)}
        />
      );
    case "select":
      return (
        <TextInput
          label="Default Value"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
      );
    default:
      return null;
  }
}
