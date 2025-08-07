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

  const renderTriggerProperties = (data: TriggerNodeData) => {
    const triggerRegistry = TriggerRegistry.getInstance();

    // Use schema-based rendering for triggers that have been migrated
    if (triggerRegistry.hasTrigger(data.triggerType)) {
      const trigger = triggerRegistry.getTrigger(data.triggerType);
      const schema = triggerRegistry.getConfigSchema(data.triggerType);
      
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

  const renderActionProperties = (data: ActionNodeData) => {
    const actionRegistry = ActionRegistry.getInstance();

    // Use schema-based rendering for actions that have been migrated
    if (actionRegistry.hasAction(data.actionType)) {
      const action = actionRegistry.getAction(data.actionType);
      const schema = actionRegistry.getConfigSchema(data.actionType);
      
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

  const getNodeTitle = (node: WorkflowNode): string => {
    if (node.type === "trigger") {
      const data = node.data as TriggerNodeData;
      const triggerRegistry = TriggerRegistry.getInstance();
      const trigger = triggerRegistry.getTrigger(data.triggerType);
      return trigger ? `${trigger.metadata.icon} ${trigger.metadata.label}` : "Trigger";
    }
    
    if (node.type === "action") {
      const data = node.data as ActionNodeData;
      const actionRegistry = ActionRegistry.getInstance();
      const action = actionRegistry.getAction(data.actionType);
      return action ? `${action.metadata.icon} ${action.metadata.label}` : "Action";
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
