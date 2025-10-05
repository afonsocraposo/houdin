import React, { useState } from "react";
import {
  Stack,
  Text,
  Button,
  TextInput,
  Group,
  ActionIcon,
  Box,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";

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

  return (
    <Stack gap="xs">
      {entries.map((entry, index) => (
        <Group key={index} gap="xs" align="end">
          <TextInput
            placeholder="VARIABLE_NAME"
            value={entry.key}
            onChange={(e) => handleKeyChange(index, e.target.value)}
            style={{ flex: 1 }}
            label={index === 0 ? "Name" : undefined}
          />
          <TextInput
            placeholder="value"
            value={entry.value}
            onChange={(e) => handleValueChange(index, e.target.value)}
            style={{ flex: 2 }}
            label={index === 0 ? "Value" : undefined}
          />
          <ActionIcon
            color="red"
            variant="subtle"
            onClick={() => handleRemoveEntry(index)}
            mb={6}
          >
            <IconTrash />
          </ActionIcon>
        </Group>
      ))}

      {entries.length === 0 && (
        <Text c="dimmed" ta="center" py="md">
          No variables defined
        </Text>
      )}

      <Box>
        <Button variant="light" onClick={handleAddEntry} fullWidth>
          Add Variable
        </Button>
      </Box>
    </Stack>
  );
};
