import {
  Card,
  Checkbox,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { FormFieldDefinition, FormFieldType } from "./formAction/FormBuilderr";

export default function FormBuilderItem({
  item,
  onChange,
}: {
  item: FormFieldDefinition;
  onChange: (updatedItem: FormFieldDefinition) => void;
}) {
  return (
    <Card>
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
    case "password":
      return (
        <TextInput
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
