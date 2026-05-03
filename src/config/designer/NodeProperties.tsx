import React from "react";
import {
  Stack,
  Text,
  Card,
  Group,
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
import { IconLayoutSidebarRightCollapse, IconMinus } from "@tabler/icons-react";
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
        return (
          <Stack gap="md">
            {/* Trigger description */}
            <Text size="sm" c="dimmed">
              {trigger.metadata.description}
            </Text>

            {/* Configuration */}
            <SchemaBasedProperties
              defaultConfig={undefined}
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
                <CodeHighlight
                  language="json"
                  code={JSON.stringify(
                    trigger.outputExample as Record<string, any>,
                    null,
                    2,
                  )}
                />
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
              defaultConfig={undefined}
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
                <CodeHighlight
                  language="json"
                  code={JSON.stringify(outputExample, null, 2)}
                />
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

  const getNodeTitle = (node: WorkflowNode): React.ReactNode => {
    let metadata: BaseMetadata;
    if (node.type === "trigger") {
      const triggerType = (node.data as TriggerNodeData).type;
      const trigger = nodeCatalog.triggers[triggerType];
      if (trigger) {
        metadata = trigger.metadata;
      } else {
        return "Trigger";
      }
    } else if (node.type === "action") {
      const actionType = (node.data as ActionNodeData).type;
      const action = nodeCatalog.actions[actionType];
      if (action) {
        metadata = action.metadata;
      } else {
        return "Action";
      }
    } else {
      return "Unknown";
    }
    return (
      <Group gap="xs" wrap="nowrap">
        <NodeIcon icon={metadata.icon} size={16} />
        <Text>{metadata.label}</Text>
      </Group>
    );
  };

  return (
    <Stack style={{ flex: "1 1 auto", minHeight: 0, maxHeight: "100%" }}>
      <Group mb="md" justify="space-between">
        <Text fw={500} c={getNodeTypeColor(node.type)}>
          {getNodeTitle(node)}
        </Text>
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
      <ScrollArea.Autosize flex={1} type="scroll" style={{ minHeight: 0 }}>
        <Stack gap="md">
          {node.type === "trigger" &&
            renderTriggerProperties(node.data, errors)}
          {node.type === "action" && renderActionProperties(node.data, errors)}
        </Stack>
      </ScrollArea.Autosize>
    </Stack>
  );
};
