import React, { useMemo, useState } from "react";
import {
  Modal,
  Stack,
  Textarea,
  Button,
  Group,
  Text,
  Code,
  Alert,
} from "@mantine/core";
import { IconDownload, IconCopy, IconCheck } from "@tabler/icons-react";
import { WorkflowDefinition } from "@/types/workflow";

interface ExportModalProps {
  opened: boolean;
  onClose: () => void;
  workflow: WorkflowDefinition;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  opened,
  onClose,
  workflow: rawWorkflow,
}) => {
  const [copied, setCopied] = useState(false);
  const workflow = useMemo(
    () => ({
      ...rawWorkflow,
      // remove sensitive data
      variables: rawWorkflow.variables
        ? Object.fromEntries(
            Object.entries(rawWorkflow.variables).map(([key]) => [key, ""]),
          )
        : undefined,
    }),
    [rawWorkflow],
  );
  const jsonContent = useMemo(
    () => JSON.stringify(workflow, null, 2),
    [workflow],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = jsonContent;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy also failed:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleDownload = () => {
    const dataBlob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${workflow.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Export Workflow: ${workflow.name}`}
      size="lg"
    >
      <Stack gap="md">
        <Alert color="blue">
          <Text size="sm">
            This is the JSON representation of your workflow. You can copy it to
            share with others or download it as a file.
          </Text>
        </Alert>

        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text size="sm" fw={500}>
              JSON Content
            </Text>
            <Code fz="xs">{jsonContent.length} characters</Code>
          </Group>

          <Textarea
            value={jsonContent}
            readOnly
            minRows={15}
            maxRows={20}
            autosize
            styles={{
              input: {
                fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
                fontSize: "12px",
                lineHeight: "1.4",
              },
            }}
          />
        </Stack>

        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outline"
            leftSection={
              copied ? <IconCheck size={16} /> : <IconCopy size={16} />
            }
            onClick={handleCopy}
            color={copied ? "green" : undefined}
          >
            {copied ? "Copied!" : "Copy to Clipboard"}
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={handleDownload}
          >
            Download JSON
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
