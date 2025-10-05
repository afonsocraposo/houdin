import React, { useState } from "react";
import {
  Stack,
  Text,
  Button,
  TextInput,
  Card,
  Group,
  ActionIcon,
  Collapse,
  Box,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconVariable,
} from "@tabler/icons-react";

interface EnvironmentVariablesProps {
  variables: Record<string, string>;
  onChange: (environmentVariables: Record<string, string>) => void;
}

interface EnvVarEntry {
  key: string;
  value: string;
}

export const EnvironmentVariables: React.FC<EnvironmentVariablesProps> = ({
  variables = {},
  onChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<EnvVarEntry[]>(() => {
    return Object.entries(variables).map(([key, value]) => ({
      key,
      value,
    }));
  });

  const updateEnvironmentVariables = (newEntries: EnvVarEntry[]) => {
    const envVars = newEntries
      .filter((entry) => entry.key.trim() !== "")
      .reduce(
        (acc, entry) => {
          acc[entry.key.trim()] = entry.value;
          return acc;
        },
        {} as Record<string, string>,
      );
    onChange(envVars);
  };

  const handleAddEntry = () => {
    const newEntries = [...entries, { key: "", value: "" }];
    setEntries(newEntries);
  };

  const handleRemoveEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    updateEnvironmentVariables(newEntries);
  };

  const handleKeyChange = (index: number, key: string) => {
    const newEntries = entries.map((entry, i) =>
      i === index ? { ...entry, key } : entry,
    );
    setEntries(newEntries);
    updateEnvironmentVariables(newEntries);
  };

  const handleValueChange = (index: number, value: string) => {
    const newEntries = entries.map((entry, i) =>
      i === index ? { ...entry, value } : entry,
    );
    setEntries(newEntries);
    updateEnvironmentVariables(newEntries);
  };

  const envVarCount = Object.keys(variables).length;

  return (
    <Card withBorder padding="md">
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <IconVariable size={16} />
          <Text size="sm" fw={500}>
            Workflow Variables
          </Text>
          {envVarCount > 0 && (
            <Text size="xs" c="dimmed">
              ({envVarCount} variable{envVarCount !== 1 ? "s" : ""})
            </Text>
          )}
        </Group>
        <ActionIcon
          variant="subtle"
          onClick={() => setExpanded(!expanded)}
          size="sm"
        >
          {expanded ? (
            <IconChevronUp size={16} />
          ) : (
            <IconChevronDown size={16} />
          )}
        </ActionIcon>
      </Group>

      <Collapse in={expanded}>
        <Stack gap="xs">
          <Text size="xs" c="dimmed">
            Define environment variables that can be referenced in your workflow
            using {"{{env.VARIABLE_NAME}}"} syntax.
          </Text>

          {entries.map((entry, index) => (
            <Group key={index} gap="xs" align="flex-end">
              <TextInput
                placeholder="VARIABLE_NAME"
                value={entry.key}
                onChange={(e) => handleKeyChange(index, e.target.value)}
                size="xs"
                style={{ flex: 1 }}
                label={index === 0 ? "Name" : undefined}
              />
              <TextInput
                placeholder="value"
                value={entry.value}
                onChange={(e) => handleValueChange(index, e.target.value)}
                size="xs"
                style={{ flex: 2 }}
                label={index === 0 ? "Value" : undefined}
              />
              <ActionIcon
                color="red"
                variant="subtle"
                onClick={() => handleRemoveEntry(index)}
                size="sm"
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          ))}

          {entries.length === 0 && (
            <Text size="xs" c="dimmed" ta="center" py="md">
              No environment variables defined
            </Text>
          )}

          <Box>
            <Button
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={handleAddEntry}
              size="xs"
              fullWidth
            >
              Add Variable
            </Button>
          </Box>
        </Stack>
      </Collapse>
    </Card>
  );
};
