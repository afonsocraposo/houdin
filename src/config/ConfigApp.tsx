import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Card,
  TextInput,
  Switch,
  Select,
  Textarea,
  Group,
  Badge,
  Notification,
  Alert,
  Modal,
  ActionIcon,
  Table,
  Accordion,
  Tabs,
} from "@mantine/core";
import {
  IconSettings,
  IconInfoCircle,
  IconCheck,
  IconPlus,
  IconTrash,
  IconEdit,
  IconNetwork,
  IconList,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { StorageManager } from "../services/storage";
import { Recipe } from "../types";
import { WorkflowDesigner } from "../components/WorkflowDesigner";
import { WorkflowDefinition } from "../types/workflow";

function ConfigApp() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [saved, setSaved] = useState(false);
  const [currentView, setCurrentView] = useState<'recipes' | 'workflows' | 'designer'>('recipes');
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowDefinition | null>(null);
  const storageManager = StorageManager.getInstance();

  // Form state for recipe creation/editing
  const [formData, setFormData] = useState<Partial<Recipe>>({
    name: "",
    enabled: true,
    urlPattern: "",
    selector: "",
    componentType: "button",
    componentText: "",
    componentStyle: "",
    workflowType: "copy",
    workflowConfig: {},
  });

  useEffect(() => {
    // Load existing recipes and workflows from storage using StorageManager
    const loadData = async () => {
      try {
        const [loadedRecipes, loadedWorkflows] = await Promise.all([
          storageManager.getRecipes(),
          storageManager.getWorkflows()
        ]);
        
        setRecipes(loadedRecipes);
        setWorkflows(loadedWorkflows);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();

    // Set up storage change listener
    const handleStorageChange = (updatedRecipes: any[], updatedWorkflows: any[]) => {
      setRecipes(updatedRecipes);
      setWorkflows(updatedWorkflows);
    };

    storageManager.onStorageChanged(handleStorageChange);
  }, []);

  const saveRecipes = async (newRecipes: Recipe[]) => {
    try {
      await storageManager.saveRecipes(newRecipes);
      setRecipes(newRecipes);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save recipes:', error);
    }
  };

  const handleWorkflowSave = async (workflow: WorkflowDefinition) => {
    try {
      const updatedWorkflows = editingWorkflow 
        ? workflows.map(w => w.id === workflow.id ? workflow : w)
        : [...workflows, workflow];
      
      await storageManager.saveWorkflows(updatedWorkflows);
      setWorkflows(updatedWorkflows);
      setCurrentView('workflows');
      setEditingWorkflow(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  };

  const handleCreateWorkflow = () => {
    setEditingWorkflow(null);
    setCurrentView('designer');
  };

  const handleEditWorkflow = (workflow: WorkflowDefinition) => {
    setEditingWorkflow(workflow);
    setCurrentView('designer');
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      const updatedWorkflows = workflows.filter(w => w.id !== id);
      await storageManager.saveWorkflows(updatedWorkflows);
      setWorkflows(updatedWorkflows);
    } catch (error) {
      console.error('Failed to delete workflow:', error);
    }
  };

  const handleToggleWorkflow = async (id: string) => {
    try {
      const updatedWorkflows = workflows.map(w =>
        w.id === id ? { ...w, enabled: !w.enabled } : w
      );
      await storageManager.saveWorkflows(updatedWorkflows);
      setWorkflows(updatedWorkflows);
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
    }
  };

  const handleCreateRecipe = () => {
    setEditingRecipe(null);
    setFormData({
      name: "",
      enabled: true,
      urlPattern: "",
      selector: "",
      componentType: "button",
      componentText: "",
      componentStyle: "",
      workflowType: "copy",
      workflowConfig: {},
    });
    setModalOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData(recipe);
    setModalOpen(true);
  };

  const handleSaveRecipe = () => {
    const recipe: Recipe = {
      id: editingRecipe?.id || Date.now().toString(),
      name: formData.name || "",
      enabled: formData.enabled || true,
      urlPattern: formData.urlPattern || "",
      selector: formData.selector || "",
      componentType: formData.componentType || "button",
      componentText: formData.componentText || "",
      componentStyle: formData.componentStyle || "",
      workflowType: formData.workflowType || "copy",
      workflowConfig: formData.workflowConfig || {},
    };

    let newRecipes;
    if (editingRecipe) {
      newRecipes = recipes.map((r) => (r.id === editingRecipe.id ? recipe : r));
    } else {
      newRecipes = [...recipes, recipe];
    }

    saveRecipes(newRecipes);
    setModalOpen(false);
  };

  const handleDeleteRecipe = (id: string) => {
    const newRecipes = recipes.filter((r) => r.id !== id);
    saveRecipes(newRecipes);
  };

  const handleToggleRecipe = (id: string) => {
    const newRecipes = recipes.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r,
    );
    saveRecipes(newRecipes);
  };

  const defaultRecipes: Recipe[] = [
    {
      id: "github-pr-review",
      name: "GitHub PR Review Button",
      enabled: true,
      urlPattern: "*://github.com/*/pull/*",
      selector: ".gh-header-actions",
      componentType: "button",
      componentText: "Review",
      componentStyle:
        "background: #28a745; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; margin-left: 8px;",
      workflowType: "modal",
      workflowConfig: {
        sourceSelector: ".js-comment-body p",
        modalTitle: "PR Review",
        modalContent: "Copied PR description for review",
      },
    },
  ];

  const loadExamples = () => {
    const newRecipes = [
      ...recipes,
      ...defaultRecipes.filter((dr) => !recipes.find((r) => r.id === dr.id)),
    ];
    saveRecipes(newRecipes);
  };

  // Show workflow designer if in designer view
  if (currentView === 'designer') {
    return (
      <WorkflowDesigner
        workflow={editingWorkflow || undefined}
        onSave={handleWorkflowSave}
        onCancel={() => setCurrentView('workflows')}
      />
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div style={{ textAlign: "center" }}>
          <IconSettings size={48} />
          <Title order={1} mt="sm">
            changeme Configuration
          </Title>
          <Text size="sm" c="dimmed">
            Create workflow recipes to inject components and automate tasks on any website
          </Text>
        </div>

        {saved && (
          <Notification
            icon={<IconCheck size={18} />}
            color="green"
            title="Saved!"
            onClose={() => setSaved(false)}
          >
            Your changes have been saved successfully.
          </Notification>
        )}

        <Alert
          icon={<IconInfoCircle size={16} />}
          title="Access this page anytime"
          color="blue"
        >
          You can always access this configuration page by typing{" "}
          <Badge variant="light">https://changeme.config</Badge> in your browser address bar.
        </Alert>

        <Tabs value={currentView} onChange={(value) => setCurrentView(value as any)}>
          <Tabs.List>
            <Tabs.Tab value="recipes" leftSection={<IconList size={16} />}>
              Legacy Recipes
            </Tabs.Tab>
            <Tabs.Tab value="workflows" leftSection={<IconNetwork size={16} />}>
              Visual Workflows
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="recipes">
            <Card withBorder padding="lg" mt="md">
              <Group justify="space-between" mb="md">
                <Title order={3}>Legacy Recipes</Title>
                <Group>
                  <Button variant="outline" onClick={loadExamples}>
                    Load Examples
                  </Button>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreateRecipe}
                  >
                    Create Recipe
                  </Button>
                </Group>
              </Group>

              {recipes.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                  No recipes created yet. Click "Create Recipe" to get started!
                </Text>
              ) : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>URL Pattern</Table.Th>
                      <Table.Th>Component</Table.Th>
                      <Table.Th>Workflow</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {recipes.map((recipe) => (
                      <Table.Tr key={recipe.id}>
                        <Table.Td>
                          <Text fw={500}>{recipe.name}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {recipe.urlPattern}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">{recipe.componentType}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="outline">{recipe.workflowType}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Switch
                            checked={recipe.enabled}
                            onChange={() => handleToggleRecipe(recipe.id)}
                            size="sm"
                          />
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="subtle"
                              onClick={() => handleEditRecipe(recipe)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDeleteRecipe(recipe.id)}
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
          </Tabs.Panel>

          <Tabs.Panel value="workflows">
            <Card withBorder padding="lg" mt="md">
              <Group justify="space-between" mb="md">
                <Title order={3}>Visual Workflows</Title>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={handleCreateWorkflow}
                >
                  Create Workflow
                </Button>
              </Group>

              {workflows.length === 0 ? (
                <Stack align="center" py="xl">
                  <IconNetwork size={64} color="gray" />
                  <Text c="dimmed" ta="center">
                    No workflows created yet. Visual workflows provide a more intuitive way to create complex automations.
                  </Text>
                  <Button onClick={handleCreateWorkflow} mt="md">
                    Create Your First Workflow
                  </Button>
                </Stack>
              ) : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Description</Table.Th>
                      <Table.Th>Nodes</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {workflows.map((workflow) => (
                      <Table.Tr key={workflow.id}>
                        <Table.Td>
                          <Text fw={500}>{workflow.name}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {workflow.description || 'No description'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">{workflow.nodes.length} nodes</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Switch
                            checked={workflow.enabled}
                            onChange={() => handleToggleWorkflow(workflow.id)}
                            size="sm"
                          />
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="subtle"
                              onClick={() => handleEditWorkflow(workflow)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDeleteWorkflow(workflow.id)}
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
          </Tabs.Panel>
        </Tabs>

        <Modal
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingRecipe ? "Edit Recipe" : "Create New Recipe"}
          size="lg"
        >
          <Stack gap="md">
            <TextInput
              label="Recipe Name"
              placeholder="e.g., GitHub PR Review Button"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <TextInput
              label="URL Pattern"
              placeholder="e.g., *://github.com/*/pull/* or https://example.com/*"
              description="Use * for wildcards. The recipe will only activate on matching URLs."
              value={formData.urlPattern}
              onChange={(e) =>
                setFormData({ ...formData, urlPattern: e.target.value })
              }
            />

            <TextInput
              label="Injection Selector"
              placeholder="e.g., .gh-header-actions or #main-content"
              description="CSS selector where the component will be injected"
              value={formData.selector}
              onChange={(e) =>
                setFormData({ ...formData, selector: e.target.value })
              }
            />

            <Group grow>
              <Select
                label="Component Type"
                data={[
                  { value: "button", label: "Button" },
                  { value: "input", label: "Input Field" },
                  { value: "text", label: "Text/Label" },
                ]}
                value={formData.componentType}
                onChange={(value) =>
                  setFormData({ ...formData, componentType: value as any })
                }
              />

              <TextInput
                label="Component Text"
                placeholder="e.g., Review, Copy, Execute"
                value={formData.componentText}
                onChange={(e) =>
                  setFormData({ ...formData, componentText: e.target.value })
                }
              />
            </Group>

            <Textarea
              label="Component Style (CSS)"
              placeholder="background: #28a745; color: white; padding: 8px 16px; border: none; border-radius: 6px;"
              rows={3}
              value={formData.componentStyle}
              onChange={(e) =>
                setFormData({ ...formData, componentStyle: e.target.value })
              }
            />

            <Select
              label="Workflow Type"
              data={[
                { value: "copy", label: "Copy Content" },
                { value: "modal", label: "Show Modal" },
                { value: "navigate", label: "Navigate to URL" },
                { value: "custom", label: "Custom Script" },
              ]}
              value={formData.workflowType}
              onChange={(value) =>
                setFormData({ ...formData, workflowType: value as any })
              }
            />

            <Accordion variant="contained">
              <Accordion.Item value="workflow">
                <Accordion.Control>Workflow Configuration</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    {(formData.workflowType === "copy" ||
                      formData.workflowType === "modal") && (
                      <TextInput
                        label="Source Selector"
                        placeholder="e.g., .js-comment-body p"
                        description="CSS selector of content to copy/display"
                        value={formData.workflowConfig?.sourceSelector || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            workflowConfig: {
                              ...formData.workflowConfig,
                              sourceSelector: e.target.value,
                            },
                          })
                        }
                      />
                    )}

                    {formData.workflowType === "modal" && (
                      <>
                        <TextInput
                          label="Modal Title"
                          placeholder="e.g., PR Review"
                          value={formData.workflowConfig?.modalTitle || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              workflowConfig: {
                                ...formData.workflowConfig,
                                modalTitle: e.target.value,
                              },
                            })
                          }
                        />
                        <TextInput
                          label="Modal Content Prefix"
                          placeholder="e.g., Copied PR description for review"
                          value={formData.workflowConfig?.modalContent || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              workflowConfig: {
                                ...formData.workflowConfig,
                                modalContent: e.target.value,
                              },
                            })
                          }
                        />
                      </>
                    )}

                    {formData.workflowType === "navigate" && (
                      <TextInput
                        label="Navigate URL"
                        placeholder="https://example.com/process"
                        value={formData.workflowConfig?.navigateUrl || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            workflowConfig: {
                              ...formData.workflowConfig,
                              navigateUrl: e.target.value,
                            },
                          })
                        }
                      />
                    )}

                    {formData.workflowType === "custom" && (
                      <Textarea
                        label="Custom JavaScript"
                        placeholder="alert('Hello from custom script!');"
                        rows={4}
                        value={formData.workflowConfig?.customScript || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            workflowConfig: {
                              ...formData.workflowConfig,
                              customScript: e.target.value,
                            },
                          })
                        }
                      />
                    )}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>

            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRecipe}>
                {editingRecipe ? "Update Recipe" : "Create Recipe"}
              </Button>
            </Group>
          </Stack>
        </Modal>

        <Text size="xs" c="dimmed" ta="center">
          changeme Extension v1.0.0 - Workflow Automation Made Simple
        </Text>
      </Stack>
    </Container>
  );
}

export default ConfigApp;
