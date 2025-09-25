import React from "react";
import {
  Stack,
  Text,
  Card,
  Group,
  ScrollArea,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import {
  ActionNodeData,
  TriggerNodeData,
  WorkflowNode,
} from "@/types/workflow";
import { ActionRegistry } from "@/services/actionRegistry";
import { TriggerRegistry } from "@/services/triggerRegistry";
import { SchemaBasedProperties } from "./SchemaBasedProperties";
import { IconArrowBarToRight, IconHelpCircle } from "@tabler/icons-react";
import { CodeHighlight } from "@mantine/code-highlight";

interface NodePropertiesProps {
  node: WorkflowNode | null;
  onNodeUpdate: (updatedNode: WorkflowNode) => void;
  errors?: Record<string, string[]>;
  onClose: () => void;
}

export const NodeProperties: React.FC<NodePropertiesProps> = ({
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
    const triggerRegistry = TriggerRegistry.getInstance();
    const triggerType = data.type;

    if (!triggerType) {
      return <Text c="red">No trigger type found</Text>;
    }

    // Use schema-based rendering for triggers that have been migrated
    if (triggerRegistry.hasTrigger(triggerType)) {
      const trigger = triggerRegistry.getTrigger(triggerType);
      const schema = triggerRegistry.getConfigSchema(triggerType);

      if (trigger && schema) {
        return (
          <Stack gap="md">
            {/* Trigger description */}
            <Text size="sm" c="dimmed">
              {trigger.metadata.description}
            </Text>

            {/* Configuration */}
            <SchemaBasedProperties
              defaultConfig={trigger.getDefaultConfig()}
              schema={schema}
              values={data.config}
              onChange={(key, value) => updateNodeData(`config.${key}`, value)}
              errors={errors}
            />

            {/* Example output */}
            {trigger.outputExample && (
              <Stack gap="xs" mt="md">
                <Text size="sm" c="dimmed">
                  Example output:
                </Text>
                <CodeHighlight
                  language="json"
                  code={JSON.stringify(trigger.outputExample, null, 2)}
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
    const actionRegistry = ActionRegistry.getInstance();
    const actionType = data.type;

    if (!actionType) {
      return <Text c="red">No action type found</Text>;
    }

    // Use schema-based rendering for actions that have been migrated
    if (actionRegistry.hasAction(actionType)) {
      const action = actionRegistry.getAction(actionType);
      const schema = actionRegistry.getConfigSchema(actionType);

      if (action && schema) {
        return (
          <Stack gap="md">
            {/* Action description */}
            <Text size="sm" c="dimmed">
              {action.metadata.description}
            </Text>

            {/* Configuration */}
            <SchemaBasedProperties
              defaultConfig={action.getDefaultConfig()}
              schema={schema}
              values={data.config}
              onChange={(key, value) => updateNodeData(`config.${key}`, value)}
              errors={errors}
            />

            {/* Example output */}
            {action.outputExample && (
              <Stack gap="xs" mt="md">
                <Text size="sm" c="dimmed">
                  Example output:
                </Text>
                <CodeHighlight
                  language="json"
                  code={JSON.stringify(action.outputExample, null, 2)}
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

  const renderConditionProperties = (
    data: any,
    _errors: Record<string, string[]> | undefined,
  ) => {
    const conditionType = data.conditionType;

    switch (conditionType) {
      default:
        return null;
    }
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case "trigger":
        return "red";
      case "action":
        return "blue";
      case "condition":
        return "orange";
      default:
        return "gray";
    }
  };

  const getNodeTitle = (node: WorkflowNode): string => {
    if (node.type === "trigger") {
      const triggerType = (node.data as TriggerNodeData).type;
      const triggerRegistry = TriggerRegistry.getInstance();
      const trigger = triggerRegistry.getTrigger(triggerType);
      return trigger
        ? `${trigger.metadata.icon} ${trigger.metadata.label}`
        : "Trigger";
    }

    if (node.type === "action") {
      const actionType = (node.data as ActionNodeData).type;
      const actionRegistry = ActionRegistry.getInstance();
      const action = actionRegistry.getAction(actionType);
      return action
        ? `${action.metadata.icon} ${action.metadata.label}`
        : "Action";
    }

    return "Unknown";
  };

  return (
    <>
      <Group mb="md" justify="space-between">
        <Group>
          <ActionIcon
            onClick={onClose}
            variant="subtle"
            c="dimmed"
            aria-label="Close node properties"
          >
            <IconArrowBarToRight />
          </ActionIcon>
          <Text fw={500} c={getNodeTypeColor(node.type)}>
            {getNodeTitle(node)}
          </Text>
        </Group>
        <Tooltip
          label={
            <Text size="sm">
              You can reference node data on any field using the syntax:&nbsp;
              <code>{"{{action-1758059334040}}"}</code> or&nbsp;
              <code>{"{{action-1758059334040.property}}"}</code>
            </Text>
          }
          withArrow
        >
          <IconHelpCircle color="gray" />
        </Tooltip>
      </Group>
      <ScrollArea h="95%" style={{ overflowY: "auto" }}>
        <Stack gap="md">
          {node.type === "trigger" &&
            renderTriggerProperties(node.data, errors)}
          {node.type === "action" && renderActionProperties(node.data, errors)}
          {node.type === "condition" &&
            renderConditionProperties(node.data, errors)}
        </Stack>
      </ScrollArea>
    </>
  );
};
