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
import { ActionRegistry } from "@/services/actionRegistry";
import { TriggerRegistry } from "@/services/triggerRegistry";
import { SchemaBasedProperties } from "./SchemaBasedProperties";
import { IconArrowBarToRight } from "@tabler/icons-react";
import { CodeHighlight } from "@mantine/code-highlight";
import VariablesButton from "./VariablesButton";
import NodeIcon from "@/components/NodeIcon";
import { BaseMetadata } from "@/types/base";
import { FormAction, FormActionConfig } from "@/services/actions/formAction";

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
        let outputExample = action.outputExample;
        if (action.metadata.type === FormAction.metadata.type) {
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
              defaultConfig={action.getDefaultConfig()}
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
      const triggerRegistry = TriggerRegistry.getInstance();
      const trigger = triggerRegistry.getTrigger(triggerType);
      if (trigger) {
        metadata = trigger.metadata;
      } else {
        return "Trigger";
      }
    } else if (node.type === "action") {
      const actionType = (node.data as ActionNodeData).type;
      const actionRegistry = ActionRegistry.getInstance();
      const action = actionRegistry.getAction(actionType);
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
        <Group>
          <VariablesButton nodes={nodes} workflowVars={workflowVars} />
        </Group>
      </Group>
      <ScrollArea h="95%" type="scroll" style={{ overflowY: "auto" }}>
        <Stack gap="md">
          {node.type === "trigger" &&
            renderTriggerProperties(node.data, errors)}
          {node.type === "action" && renderActionProperties(node.data, errors)}
        </Stack>
      </ScrollArea>
    </>
  );
};
