import React, { useState, useEffect } from 'react';
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
  PasswordInput,
  Textarea,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconKey,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';
import { Credential } from '../types/credentials';
import { StorageManager } from '../services/storage';

interface CredentialsTabProps {
  onSaved?: () => void;
}

const CREDENTIAL_SERVICES = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'google_ai', label: 'Google AI' },
  { value: 'azure_openai', label: 'Azure OpenAI' },
  { value: 'custom', label: 'Custom API' },
];

const CREDENTIAL_TYPES = [
  { value: 'api_key', label: 'API Key' },
  { value: 'bearer_token', label: 'Bearer Token' },
  { value: 'basic_auth', label: 'Basic Auth' },
  { value: 'custom', label: 'Custom' },
];

export const CredentialsTab: React.FC<CredentialsTabProps> = ({ onSaved }) => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set());
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    service: '',
    type: 'api_key' as Credential['type'],
    description: '',
    value: '',
    username: '',
  });

  const storageManager = StorageManager.getInstance();

  useEffect(() => {
    loadCredentials();
    
    const handleCredentialsChange = (updatedCredentials: Credential[]) => {
      setCredentials(updatedCredentials);
    };

    storageManager.onCredentialsChanged(handleCredentialsChange);
  }, []);

  const loadCredentials = async () => {
    try {
      const loadedCredentials = await storageManager.getCredentials();
      setCredentials(loadedCredentials);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.value.trim()) {
      alert('Please fill in the required fields (name and value)');
      return;
    }

    try {
      const credential: Credential = {
        id: editingCredential?.id || `credential-${Date.now()}`,
        name: formData.name,
        service: formData.service as Credential['service'],
        type: formData.type,
        description: formData.description,
        value: formData.value,
        username: formData.type === 'basic_auth' ? formData.username : undefined,
        createdAt: editingCredential?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      const updatedCredentials = editingCredential
        ? credentials.map(c => c.id === credential.id ? credential : c)
        : [...credentials, credential];

      await storageManager.saveCredentials(updatedCredentials);
      setCredentials(updatedCredentials);
      
      handleCloseModal();
      onSaved?.();
    } catch (error) {
      console.error('Failed to save credential:', error);
      alert('Failed to save credential. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return;
    }

    try {
      const updatedCredentials = credentials.filter(c => c.id !== id);
      await storageManager.saveCredentials(updatedCredentials);
      setCredentials(updatedCredentials);
    } catch (error) {
      console.error('Failed to delete credential:', error);
      alert('Failed to delete credential. Please try again.');
    }
  };

  const handleOpenModal = (credential?: Credential) => {
    if (credential) {
      setEditingCredential(credential);
      setFormData({
        name: credential.name,
        service: credential.service,
        type: credential.type,
        description: credential.description || '',
        value: credential.value,
        username: credential.username || '',
      });
    } else {
      setEditingCredential(null);
      setFormData({
        name: '',
        service: '',
        type: 'api_key',
        description: '',
        value: '',
        username: '',
      });
    }
    setModalOpened(true);
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingCredential(null);
    setFormData({
      name: '',
      service: '',
      type: 'api_key',
      description: '',
      value: '',
      username: '',
    });
  };

  const toggleValueVisibility = (credentialId: string) => {
    const newVisible = new Set(visibleValues);
    if (newVisible.has(credentialId)) {
      newVisible.delete(credentialId);
    } else {
      newVisible.add(credentialId);
    }
    setVisibleValues(newVisible);
  };

  const getServiceLabel = (service: string) => {
    return CREDENTIAL_SERVICES.find(s => s.value === service)?.label || service;
  };

  const getTypeLabel = (type: string) => {
    return CREDENTIAL_TYPES.find(t => t.value === type)?.label || type;
  };

  const maskValue = (value: string, show: boolean) => {
    if (show) return value;
    if (value.length <= 8) return '••••••••';
    return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
  };

  return (
    <Stack gap="lg">
      <Card withBorder padding="lg">
        <Group justify="space-between" mb="md">
          <Title order={3}>API Credentials</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => handleOpenModal()}
          >
            Add Credential
          </Button>
        </Group>

        <Text size="sm" c="dimmed" mb="lg">
          Store API keys and other credentials for third-party services used in your workflows.
          All credentials are stored securely in your browser's extension storage.
        </Text>

        {credentials.length === 0 ? (
          <Stack align="center" py="xl">
            <IconKey size={64} color="gray" />
            <Text c="dimmed" ta="center">
              No credentials stored yet. Add your first API key to get started.
            </Text>
            <Button onClick={() => handleOpenModal()} mt="md">
              Add Your First Credential
            </Button>
          </Stack>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Service</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {credentials.map((credential) => (
                <Table.Tr key={credential.id}>
                  <Table.Td>
                    <div>
                      <Text fw={500}>{credential.name}</Text>
                      {credential.description && (
                        <Text size="xs" c="dimmed">
                          {credential.description}
                        </Text>
                      )}
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light">
                      {getServiceLabel(credential.service)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{getTypeLabel(credential.type)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Text
                        size="sm"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {maskValue(credential.value, visibleValues.has(credential.id))}
                      </Text>
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => toggleValueVisibility(credential.id)}
                        title="Toggle visibility"
                      >
                        {visibleValues.has(credential.id) ? (
                          <IconEyeOff size={14} />
                        ) : (
                          <IconEye size={14} />
                        )}
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => handleOpenModal(credential)}
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
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={editingCredential ? 'Edit Credential' : 'Add New Credential'}
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="e.g., OpenAI API Key"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label="Service"
            placeholder="Select a service"
            data={CREDENTIAL_SERVICES}
            value={formData.service}
            onChange={(value) => setFormData({ ...formData, service: value || '' })}
            searchable
            clearable
          />

          <Select
            label="Type"
            data={CREDENTIAL_TYPES}
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value as Credential['type'] || 'api_key' })}
            required
          />

          {formData.type === 'basic_auth' && (
            <TextInput
              label="Username"
              placeholder="Username for basic auth"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          )}

          <PasswordInput
            label="Value"
            placeholder="Enter your API key or token"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            required
          />

          <Textarea
            label="Description (Optional)"
            placeholder="Brief description of this credential"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            minRows={2}
          />

          <Group justify="flex-end">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingCredential ? 'Update' : 'Save'} Credential
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};