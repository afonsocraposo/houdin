import {
  ActionIcon,
  Box,
  Card,
  Group,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import {
  FillFormFieldDefinition,
  FillFormSelectorType,
} from "./FillFormBuilder";
import { IconTrash } from "@tabler/icons-react";

interface FillFormBuilderItemProps {
  item: FillFormFieldDefinition;
  onChange: (updatedItem: FillFormFieldDefinition) => void;
  onDelete: () => void;
}
export default function FillFormBuilderItem({
  item,
  onChange,
  onDelete,
}: FillFormBuilderItemProps) {
  return (
    <Card pos="relative">
      <Stack>
        <Select
          label="Selector Type"
          value={item.selectorType}
          data={
            [
              { label: "CSS Selector", value: "css" },
              { label: "XPath", value: "xpath" },
              { label: "Label", value: "label" },
              { label: "Name", value: "name" },
              { label: "Placeholder", value: "placeholder" },
            ] as { label: string; value: FillFormSelectorType }[]
          }
          onChange={(value) =>
            onChange({
              ...item,
              selectorType: value as FillFormSelectorType,
            })
          }
        />
        <TextInput
          label="Selector"
          value={item.selector}
          onChange={(e) => {
            onChange({ ...item, selector: e.currentTarget.value });
          }}
        />
        <TextInput
          label="Value"
          value={item.value}
          onChange={(e) => onChange({ ...item, value: e.currentTarget.value })}
        />
      </Stack>
      <Box pos="absolute" top={10} right={10}>
        <Group>
          <ActionIcon color="red" onClick={onDelete} size="xs" variant="subtle">
            <IconTrash />
          </ActionIcon>
        </Group>
      </Box>
    </Card>
  );
}
