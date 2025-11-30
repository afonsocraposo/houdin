import React, { useState } from "react";
import {
  Stack,
  Card,
  Title,
  Text,
  Button,
  Group,
  Table,
  ActionIcon,
  Badge,
  Modal,
  TextInput,
  Select,
  Textarea,
} from "@mantine/core";
import { IconPlus, IconEdit, IconTrash, IconKey } from "@tabler/icons-react";
import { Credential } from "@/types/credentials";
import { CredentialRegistry } from "@/services/credentialRegistry";
import { SchemaBasedProperties } from "@/config/designer/SchemaBasedProperties";
import { NotificationService } from "@/services/notification";
import { useStore } from "@/store";
// @ts-ignore
import sha256 from "crypto-js/sha256";

interface CredentialsTabProps {
  onSaved?: () => void;
}

export const CredentialsTab: React.FC<CredentialsTabProps> = ({ onSaved }) => {
  const credentials = useStore((state) => state.credentials);
  const setCredentials = useStore((state) => state.setCredentials);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(
    null,
  );

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    config: {} as Record<string, any>,
  });

  const credentialRegistry = CredentialRegistry.getInstance();

  const generateCredentialId = (type: string, _name: string) => {
    const name = _name.trim();
    const concat = `${type}:${name}`;
    const hash = sha256(concat).toString();
    return hash;
  };

  const handleSave = async () => {
    if (!formData.name || !formData.type.trim()) {
      NotificationService.showErrorNotification({
        title: "Please fill in the required fields",
      });
      return;
    }

    try {
      // Validate configuration using registry
      const validation = credentialRegistry.validateConfig(
        formData.type,
        formData.config,
      );
      if (!validation.valid) {
        NotificationService.showErrorNotification({
          title: "Invalid configuration",
          message: JSON.stringify(validation.errors),
        });
        return;
      }
      const id = generateCredentialId(
        formData.type,
        formData.name.toLowerCase(),
      ).substr(0, 12);
      const credentialId = `credential-${id}`;
      if (credentials.some((c) => c.id === credentialId)) {
        NotificationService.showErrorNotification({
          title: "Credential with this type and name already exists",
        });
        return;
      }

      const credential: Credential = {
        id: credentialId,
        name: formData.name,
        type: formData.type,
        description: formData.description,
        config: formData.config,
        createdAt: editingCredential?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      const updatedCredentials = editingCredential
        ? credentials.map((c) => (c.id === credential.id ? credential : c))
        : [...credentials, credential];

      setCredentials(updatedCredentials);
      handleCloseModal();
      onSaved?.();
    } catch (error) {
      console.error("Failed to save credential:", error);
      NotificationService.showErrorNotification({
        title: "Failed to save credential",
        message: "Please try again later.",
      });
    }
  };

  const handleEdit = (credential: Credential) => {
    setEditingCredential(credential);
    setFormData({
      name: credential.name,
      type: credential.type,
      description: credential.description || "",
      config: credential.config || {},
    });
    setModalOpened(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this credential?")) {
      return;
    }

    try {
      const updatedCredentials = credentials.filter((c) => c.id !== id);
      setCredentials(updatedCredentials);
      onSaved?.();
    } catch (error) {
      console.error("Failed to delete credential:", error);
      NotificationService.showErrorNotification({
        title: "Failed to delete credential",
        message: "Please try again later.",
      });
    }
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingCredential(null);
    setFormData({
      name: "",
      type: "",
      description: "",
      config: {},
    });
  };

  const handleOpenModal = () => {
    setEditingCredential(null);
    setFormData({
      name: "",
      type: "",
      description: "",
      config: {},
    });
    setModalOpened(true);
  };

  const handleConfigChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
  };

  // Get available credential types from registry
  const credentialTypeOptions = credentialRegistry
    .getAllCredentialMetadata()
    .map((meta) => ({
      value: meta.type,
      label: meta.label,
    }));

  const selectedCredentialSchema = formData.type
    ? credentialRegistry.getConfigSchema(formData.type)
    : null;

  return (
    <Card withBorder padding="lg">
      <Group justify="space-between" mb="md">
        <Title order={3}>Credentials</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleOpenModal}>
          Add Credential
        </Button>
      </Group>

      {credentials.length === 0 ? (
        <Stack align="center" py="xl">
          <IconKey size={64} color="gray" />
          <Text c="dimmed" ta="center">
            No credentials created yet. Credentials store authentication
            information for external services.
          </Text>
          <Button onClick={handleOpenModal} mt="md">
            Create Your First Credential
          </Button>
        </Stack>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {credentials
              .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
              .map((credential) => {
                const credentialMeta = credentialRegistry
                  .getAllCredentialMetadata()
                  .find((meta) => meta.type === credential.type);

                return (
                  <Table.Tr key={credential.id}>
                    <Table.Td>
                      <Text fw={500}>{credential.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light">
                        {credentialMeta?.label || credential.type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {credential.description || "No description"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(credential.createdAt).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => handleEdit(credential)}
                          title="Edit credential"
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(credential.id)}
                          title="Delete credential"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={editingCredential ? "Edit Credential" : "Add Credential"}
        size="lg"
      >
        <Stack gap="md">
          <Select
            label="Type"
            placeholder="Select credential type..."
            data={credentialTypeOptions}
            value={formData.type}
            onChange={(value) => {
              setFormData((prev) => ({
                ...prev,
                type: value || "",
                config: {}, // Reset config when type changes
              }));
            }}
            required
          />

          <TextInput
            label="Name"
            placeholder="Enter credential name..."
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            required
            disabled={!!editingCredential}
            readOnly={!!editingCredential}
          />

          <Textarea
            label="Description"
            placeholder="Optional description..."
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={2}
          />

          {selectedCredentialSchema && (
            <SchemaBasedProperties
              schema={selectedCredentialSchema}
              values={formData.config}
              onChange={handleConfigChange}
            />
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingCredential ? "Update" : "Create"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
};
