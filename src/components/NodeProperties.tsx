import React from "react";
import {
  Stack,
  TextInput,
  Textarea,
  Text,
  Card,
  Group,
  ScrollArea,
} from "@mantine/core";
import {
  WorkflowNode,
  TriggerNodeData,
  ActionNodeData,
  ConditionNodeData,
} from "../types/workflow";
import { ActionRegistry } from "../services/actionRegistry";
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

  const renderTriggerProperties = (data: TriggerNodeData) => {
    switch (data.triggerType) {
      case "component-load":
        return (
          <TextInput
            label="Element Selector"
            placeholder=".button, #submit"
            description="CSS selector for the element"
            value={data.config.selector || ""}
            onChange={(e) => updateNodeData("config.selector", e.target.value)}
          />
        );

      case "delay":
        return (
          <TextInput
            label="Delay (milliseconds)"
            placeholder="1000"
            description="Delay in milliseconds"
            value={data.config.delay?.toString() || ""}
            onChange={(e) =>
              updateNodeData("config.delay", parseInt(e.target.value) || 0)
            }
          />
        );

      case "page-load":
        return (
          <Text size="sm" c="dimmed">
            This trigger activates when the page loads. No configuration needed.
          </Text>
        );

      default:
        return null;
    }
  };

  const renderActionProperties = (data: ActionNodeData) => {
    const actionRegistry = ActionRegistry.getInstance();

    // Use schema-based rendering for actions that have been migrated
    if (actionRegistry.hasAction(data.actionType)) {
      const schema = actionRegistry.getConfigSchema(data.actionType);
      if (schema) {
        return (
          <SchemaBasedProperties
            schema={schema}
            values={data.config}
            onChange={(key, value) => updateNodeData(`config.${key}`, value)}
          />
        );
      }
    }

    // All actions should now be handled by schema-based rendering
    return null;
  };

  const renderConditionProperties = (data: ConditionNodeData) => {
    switch (data.conditionType) {
      case "element-exists":
        return (
          <TextInput
            label="Element Selector"
            placeholder=".element, #id"
            description="CSS selector to check for existence"
            value={data.config.selector || ""}
            onChange={(e) => updateNodeData("config.selector", e.target.value)}
          />
        );

      case "custom-condition":
        return (
          <Textarea
            label="Custom Condition (JavaScript)"
            placeholder="return document.querySelector('.element').textContent.includes('text');"
            description="Return true or false"
            rows={4}
            value={data.config.customScript || ""}
            onChange={(e) =>
              updateNodeData("config.customScript", e.target.value)
            }
          />
        );

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

  return (
    <ScrollArea h="100%">
      <Group mb="md">
        <Text fw={500} c={getNodeTypeColor(node.type)}>
          {node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node
        </Text>
      </Group>
      <Stack gap="md">
        {node.type === "trigger" &&
          renderTriggerProperties(node.data as TriggerNodeData)}
        {node.type === "action" &&
          renderActionProperties(node.data as ActionNodeData)}
        {node.type === "condition" &&
          renderConditionProperties(node.data as ConditionNodeData)}
      </Stack>
    </ScrollArea>
  );
};
