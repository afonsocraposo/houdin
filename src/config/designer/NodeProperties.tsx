import React, { useEffect, useState } from "react";
import {
  Stack,
  Text,
  TextInput,
  Card,
  Group,
  Box,
  ScrollArea,
  ActionIcon,
} from "@mantine/core";
import {
  ActionNodeData,
  TriggerNodeData,
  WorkflowNode,
} from "@/types/workflow";
import { nodeCatalog } from "@/services/nodeCatalog";
import { SchemaBasedProperties } from "./SchemaBasedProperties";
import { generateDefaultConfig } from "@/types/config-properties";
import { IconCheck, IconMinus, IconPencil, IconX } from "@tabler/icons-react";
import { CodeHighlight } from "@mantine/code-highlight";
import VariablesButton from "./VariablesButton";
import NodeIcon from "@/components/NodeIcon";
import { BaseMetadata } from "@/types/base";
import { FormAction, FormActionConfig } from "@/services/actions/form.runtime";

interface NodePropertiesProps {
  nodes: WorkflowNode[];
  workflowVars: Record<string, any>;
  node: WorkflowNode | null;
  onNodeUpdate: (updatedNode: WorkflowNode) => void;
  errors?: Record<string, string[]>;
  onClose: () => void;
}

export const NodeProperties: React.FC<NodePropertiesProps> = ({
  nodes,
  workflowVars,
  node,
  onNodeUpdate,
  onClose,
  errors,
}) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState("");

  useEffect(() => {
    setIsEditingLabel(false);
    setLabelDraft(node?.data.customLabel || "");
  }, [node?.id, node?.data.customLabel]);

  if (!node) {
    return (
      <Card withBorder p="md" style={{ minHeight: "300px" }}>
        <Text c="dimmed" ta="center" mt="xl">
          Select a node to edit its properties
        </Text>
      </Card>
    );
  }

  const updateNodeData = (path: string, value: any) => {
    const pathParts = path.split(".");
    const updatedNode = { ...node };

    let current = updatedNode.data as any;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;

    onNodeUpdate(updatedNode);
  };

  const saveCustomLabel = () => {
    const customLabel = labelDraft.trim();
    const updatedNode = {
      ...node,
      data: { ...node.data },
    };

    if (customLabel) {
      updatedNode.data.customLabel = customLabel;
    } else {
      delete updatedNode.data.customLabel;
    }

    onNodeUpdate(updatedNode);
    setLabelDraft(customLabel);
    setIsEditingLabel(false);
  };

  const renderTriggerProperties = (
    data: any,
    errors: Record<string, string[]> | undefined,
  ) => {
    const triggerType = data.type;

    if (!triggerType) {
      return <Text c="red">No trigger type found</Text>;
    }

    const trigger = nodeCatalog.triggers[triggerType];
    if (trigger) {
      const schema = trigger.configSchema;

      if (schema) {
        const defaultConfig = generateDefaultConfig(schema);

        return (
          <Stack gap="md">
            {/* Trigger description */}
            <Text size="sm" c="dimmed">
              {trigger.metadata.description}
            </Text>

            {/* Configuration */}
            <SchemaBasedProperties
              defaultConfig={defaultConfig}
              schema={schema}
              values={data.config}
              onChange={(key, value) => updateNodeData(`config.${key}`, value)}
              errors={errors}
            />

            {/* Example output */}
            {Boolean(trigger.outputExample) && (
              <Stack gap="xs" mt="md">
                <Text size="sm" c="dimmed">
                  Example output:
                </Text>
                <div style={{ maxWidth: "100%" }}>
                  <CodeHighlight
                    language="json"
                    code={JSON.stringify(
                      trigger.outputExample as Record<string, any>,
                      null,
                      2,
                    )}
                    styles={{
                      pre: {
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                      },
                    }}
                  />
                </div>
              </Stack>
            )}
          </Stack>
        );
      }
    }

    return null;
  };

  const renderActionProperties = (
    data: any,
    errors: Record<string, string[]> | undefined,
  ) => {
    const actionType = data.type;

    if (!actionType) {
      return <Text c="red">No action type found</Text>;
    }

    // Use schema-based rendering for actions that have been migrated
    const action = nodeCatalog.actions[actionType];
    if (action) {
      const schema = action.configSchema;

      if (schema) {
        const defaultConfig = generateDefaultConfig(schema);
        let outputExample = action.outputExample as Record<string, any>;
        if (action.metadata.type === "form") {
          outputExample = FormAction.getRichOutputExample(
            data.config as FormActionConfig,
          );
        }
        return (
          <Stack gap="md">
            {/* Action description */}
            <Text size="sm" c="dimmed">
              {action.metadata.description}
            </Text>

            {/* Configuration */}
            <SchemaBasedProperties
              defaultConfig={defaultConfig}
              schema={schema}
              values={data.config}
              onChange={(key, value) => updateNodeData(`config.${key}`, value)}
              errors={errors}
            />

            {/* Example output */}
            {outputExample && (
              <Stack gap="xs" mt="md">
                <Text size="sm" c="dimmed">
                  Example output:
                </Text>
                <div style={{ maxWidth: "100%" }}>
                  <CodeHighlight
                    language="json"
                    code={JSON.stringify(outputExample, null, 2)}
                    styles={{
                      pre: {
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                      },
                    }}
                  />
                </div>
              </Stack>
            )}
          </Stack>
        );
      }
    }

    // All actions should now be handled by schema-based rendering
    return null;
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case "trigger":
        return "red";
      case "action":
        return "blue";

      default:
        return "gray";
    }
  };

  const getNodeMetadata = (node: WorkflowNode): BaseMetadata | null => {
    let metadata: BaseMetadata;
    if (node.type === "trigger") {
      const triggerType = (node.data as TriggerNodeData).type;
      const trigger = nodeCatalog.triggers[triggerType];
      if (trigger) {
        metadata = trigger.metadata;
      } else {
        return null;
      }
    } else if (node.type === "action") {
      const actionType = (node.data as ActionNodeData).type;
      const action = nodeCatalog.actions[actionType];
      if (action) {
        metadata = action.metadata;
      } else {
        return null;
      }
    } else {
      return null;
    }

    return metadata;
  };

  const renderNodeTitle = (node: WorkflowNode): React.ReactNode => {
    const metadata = getNodeMetadata(node);
    const defaultLabel = getDefaultNodeLabel(node);
    const customLabel = node.data.customLabel?.trim();

    if (isEditingLabel) {
      return (
        <Group gap="xs" wrap="nowrap" align="center" style={{ flex: 1 }}>
          {metadata && <NodeIcon icon={metadata.icon} size={16} />}
          <TextInput
            size="xs"
            aria-label="Custom node label"
            placeholder={defaultLabel}
            value={labelDraft}
            onChange={(event) => setLabelDraft(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                saveCustomLabel();
              }

              if (event.key === "Escape") {
                setLabelDraft(node.data.customLabel || "");
                setIsEditingLabel(false);
              }
            }}
            styles={{ root: { flex: 1 } }}
          />
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={saveCustomLabel}
            aria-label="Save custom node label"
          >
            <IconCheck size={16} />
          </ActionIcon>
          <ActionIcon
            size="sm"
            variant="subtle"
            c="dimmed"
            onClick={() => {
              setLabelDraft(node.data.customLabel || "");
              setIsEditingLabel(false);
            }}
            aria-label="Cancel custom node label edit"
          >
            <IconX size={16} />
          </ActionIcon>
        </Group>
      );
    }

    return (
      <Group gap="xs" wrap="nowrap">
        {metadata && <NodeIcon icon={metadata.icon} size={16} />}
        <Stack gap={0}>
          <Text>{customLabel || defaultLabel}</Text>
          {customLabel ? (
            <Text size="xs" c="dimmed">
              {defaultLabel}
            </Text>
          ) : null}
        </Stack>
        <ActionIcon
          size="sm"
          variant="subtle"
          c="dimmed"
          onClick={() => setIsEditingLabel(true)}
          aria-label="Edit custom node label"
        >
          <IconPencil size={14} />
        </ActionIcon>
      </Group>
    );
  };

  const getDefaultNodeLabel = (node: WorkflowNode): string => {
    if (node.type === "trigger") {
      const triggerType = (node.data as TriggerNodeData).type;
      return nodeCatalog.triggers[triggerType]?.metadata.label || "Trigger";
    }

    if (node.type === "action") {
      const actionType = (node.data as ActionNodeData).type;
      return nodeCatalog.actions[actionType]?.metadata.label || "Action";
    }

    return "Node";
  };

  return (
    <Stack
      style={{
        flex: "1 1 auto",
        minHeight: 0,
        maxHeight: "100%",
        minWidth: 0,
      }}
    >
      <Group mb="md" justify="space-between">
        <Box c={getNodeTypeColor(node.type)} style={{ flex: 1, minWidth: 0 }}>
          {renderNodeTitle(node)}
        </Box>
        <Group>
          <VariablesButton nodes={nodes} workflowVars={workflowVars} />
          <ActionIcon
            onClick={onClose}
            variant="subtle"
            c="dimmed"
            aria-label="Close node properties"
          >
            <IconMinus />
          </ActionIcon>
        </Group>
      </Group>
      <ScrollArea.Autosize
        flex={1}
        type="scroll"
        style={{ minHeight: 0, minWidth: 0 }}
        styles={{
          viewport: {
            overflowX: "hidden",
          },
        }}
      >
        <Stack gap="md" style={{ minWidth: 0 }}>
          {node.type === "trigger" &&
            renderTriggerProperties(node.data, errors)}
          {node.type === "action" && renderActionProperties(node.data, errors)}
        </Stack>
      </ScrollArea.Autosize>
    </Stack>
  );
};
