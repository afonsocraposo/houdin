import React from "react";
import { Stack, Text, Card, Group, ScrollArea } from "@mantine/core";
import { WorkflowNode } from "../types/workflow";
import { ActionRegistry } from "../services/actionRegistry";
import { TriggerRegistry } from "../services/triggerRegistry";
import { SchemaBasedProperties } from "./SchemaBasedProperties";

interface NodePropertiesProps {
  node: WorkflowNode | null;
  onNodeUpdate: (updatedNode: WorkflowNode) => void;
}

export const NodeProperties: React.FC<NodePropertiesProps> = ({
  node,
  onNodeUpdate,
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

    let current = updatedNode.data;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;

    onNodeUpdate(updatedNode);
  };

  const renderTriggerProperties = (data: any) => {
    const triggerRegistry = TriggerRegistry.getInstance();
    const triggerType = data.triggerType;

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
              schema={schema}
              values={data.config}
              onChange={(key, value) => updateNodeData(`config.${key}`, value)}
            />
          </Stack>
        );
      }
    }

    return null;
  };

  const renderActionProperties = (data: any) => {
    const actionRegistry = ActionRegistry.getInstance();
    const actionType = data.actionType;

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
              schema={schema}
              values={data.config}
              onChange={(key, value) => updateNodeData(`config.${key}`, value)}
            />
          </Stack>
        );
      }
    }

    // All actions should now be handled by schema-based rendering
    return null;
  };

  const renderConditionProperties = (data: any) => {
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
      const triggerType = node.data?.triggerType;
      const triggerRegistry = TriggerRegistry.getInstance();
      const trigger = triggerRegistry.getTrigger(triggerType);
      return trigger
        ? `${trigger.metadata.icon} ${trigger.metadata.label}`
        : "Trigger";
    }

    if (node.type === "action") {
      const actionType = node.data?.actionType;
      const actionRegistry = ActionRegistry.getInstance();
      const action = actionRegistry.getAction(actionType);
      return action
        ? `${action.metadata.icon} ${action.metadata.label}`
        : "Action";
    }

    if (node.type === "condition") {
      return "Condition";
    }

    return "Node";
  };

  return (
    <>
      <Group mb="md">
        <Text fw={500} c={getNodeTypeColor(node.type)}>
          {getNodeTitle(node)}
        </Text>
      </Group>
      <ScrollArea h="95%" style={{ overflowY: "auto" }}>
        <Stack gap="md">
          {node.type === "trigger" && renderTriggerProperties(node.data)}
          {node.type === "action" && renderActionProperties(node.data)}
          {node.type === "condition" && renderConditionProperties(node.data)}
        </Stack>
      </ScrollArea>
    </>
  );
};
