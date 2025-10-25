import CodeEditor from "@/components/CodeEditor";
import { Group, InputLabel, Text } from "@mantine/core";
import { ReactNode } from "react";

export interface CodeInputProps {
  label?: string | ReactNode;
  description?: string;
  labelRightSection?: ReactNode;
  required?: boolean;
  placeholder?: string;
  language?: string;
  height?: string | number;
  value: string;
  onChange: (value: string) => void;
  key: string;
  error?: string | null;
}

export default function CodeInput({
  label,
  labelRightSection,
  description,
  required,
  placeholder,
  error,
  language,
  height,
  value,
  onChange,
  key,
}: CodeInputProps) {
  return (
    <>
      {(label || labelRightSection) && (
        <Group h={28} justify="space-between" wrap="nowrap" align="center">
          {label && <InputLabel required={required}>{label}</InputLabel>}
          {labelRightSection}
        </Group>
      )}
      {description && (
        <Text size="xs" c="dimmed" mb="xs">
          {description}
        </Text>
      )}
      <CodeEditor
        language={language}
        value={value}
        onChange={onChange}
        height={height || 200}
        placeholder={placeholder}
        editorKey={key}
      />
      {error && (
        <Text size="xs" c="red" mt="xs">
          {error}
        </Text>
      )}
    </>
  );
}
