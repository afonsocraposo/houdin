import React from "react";
import {
  Stack,
  Text,
  Card,
  Group,
  ScrollArea,
} from "@mantine/core";
import { WorkflowNode, NodeData } from "../types/workflow";
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

  const renderTriggerProperties = (data: NodeData) => {
    const triggerRegistry = TriggerRegistry.getInstance();

    // Use schema-based rendering for triggers that have been migrated
    if (triggerRegistry.hasTrigger(data.type)) {
      const trigger = triggerRegistry.getTrigger(data.type);
      const schema = triggerRegistry.getConfigSchema(data.type);

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

  const renderActionProperties = (data: NodeData) => {
    const actionRegistry = ActionRegistry.getInstance();

    // Use schema-based rendering for actions that have been migrated
    if (actionRegistry.hasAction(data.type)) {
      const action = actionRegistry.getAction(data.type);
      const schema = actionRegistry.getConfigSchema(data.type);

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

  const renderConditionProperties = (data: NodeData) => {
    switch (data.type) {
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
      const data = node.data as NodeData;
      const triggerRegistry = TriggerRegistry.getInstance();
      const trigger = triggerRegistry.getTrigger(data.type);
      return trigger
        ? `${trigger.metadata.icon} ${trigger.metadata.label}`
        : "Trigger";
    }

    if (node.type === "action") {
      const data = node.data as NodeData;
      const actionRegistry = ActionRegistry.getInstance();
      const action = actionRegistry.getAction(data.type);
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
    <ScrollArea h="100%">
      <Group mb="md">
        <Text fw={500} c={getNodeTypeColor(node.type)}>
          {getNodeTitle(node)}
        </Text>
      </Group>
      <Stack gap="md">
        {node.type === "trigger" && renderTriggerProperties(node.data)}
        {node.type === "action" &&
          renderActionProperties(node.data as NodeData)}
        {node.type === "condition" &&
          renderConditionProperties(node.data as NodeData)}
      </Stack>
    </ScrollArea>
  );
};
