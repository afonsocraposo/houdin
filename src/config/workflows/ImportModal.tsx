import React, { useState, useRef } from "react";
import {
  Modal,
  Stack,
  Textarea,
  Button,
  Group,
  Text,
  Box,
} from "@mantine/core";
import { IconUpload, IconFileImport } from "@tabler/icons-react";
import { WorkflowDefinition } from "../../types/workflow";

interface ImportModalProps {
  opened: boolean;
  onClose: () => void;
  onImport: (workflow: WorkflowDefinition) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  opened,
  onClose,
  onImport,
}) => {
  const [jsonContent, setJsonContent] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!jsonContent.trim()) {
      setError("Please paste JSON content or drag a file");
      return;
    }

    try {
      const importedWorkflow: WorkflowDefinition = JSON.parse(jsonContent);

      // Validate required fields
      if (
        !importedWorkflow.name ||
        !importedWorkflow.nodes ||
        !importedWorkflow.connections
      ) {
        setError(
          "Invalid workflow format. Required fields: name, nodes, connections",
        );
        return;
      }

      // Generate new ID and update timestamp
      const newWorkflow: WorkflowDefinition = {
        ...importedWorkflow,
        id: `workflow-${Date.now()}`,
        lastUpdated: Date.now(),
      };

      onImport(newWorkflow);
      setJsonContent("");
      setError(null);
      onClose();
    } catch (err) {
      setError("Invalid JSON format. Please check your input.");
    }
  };

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonContent(content);
      setError(null);
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(
      (file) => file.type === "application/json" || file.name.endsWith(".json"),
    );

    if (jsonFile) {
      handleFileRead(jsonFile);
    } else {
      setError("Please drop a JSON file");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  };

  const handleClose = () => {
    setJsonContent("");
    setError(null);
    setDragActive(false);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Import Workflow"
      size="lg"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Paste the JSON content of an exported workflow or drag and drop a JSON
          file.
        </Text>

        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? "#228be6" : "#dee2e6"}`,
            borderRadius: "8px",
            padding: "20px",
            textAlign: "center",
            backgroundColor: dragActive ? "#f8f9fa" : "transparent",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Stack align="center" gap="xs">
            <IconFileImport
              size={32}
              color={dragActive ? "#228be6" : "#adb5bd"}
            />
            <Text size="sm" c="dimmed">
              {dragActive
                ? "Drop your JSON file here"
                : "Click here or drag and drop a JSON file"}
            </Text>
          </Stack>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />
        </Box>

        <Textarea
          label="Or paste JSON content"
          placeholder="Paste your workflow JSON here..."
          value={jsonContent}
          onChange={(e) => {
            setJsonContent(e.target.value);
            setError(null);
          }}
          minRows={10}
          maxRows={15}
          autosize
        />

        {error && (
          <Text size="sm" c="red">
            {error}
          </Text>
        )}

        <Group justify="flex-end">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            leftSection={<IconUpload size={16} />}
            onClick={handleImport}
            disabled={!jsonContent.trim()}
          >
            Import Workflow
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
