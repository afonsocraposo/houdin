import NodeIcon from "@/components/NodeIcon";
import { ActionRegistry } from "@/services/actionRegistry";
import { FormAction, FormActionConfig } from "@/services/actions/formAction";
import { NotificationService } from "@/services/notification";
import { TriggerRegistry } from "@/services/triggerRegistry";
import {
  ActionNodeData,
  ExecutionMetadataExamples,
  TriggerNodeData,
  WorkflowNode,
} from "@/types/workflow";
import { copyToClipboard, insertAtCursor } from "@/utils/helpers";
import { useLastFocusedInput } from "@/utils/hooks";
import { ActionIcon, Code, Group, Menu, Text, Tooltip } from "@mantine/core";
import { IconVariable } from "@tabler/icons-react";
import { useMemo } from "react";

interface NodeOutputs {
  nodeId: string;
  icon: React.ReactNode;
  outputs: Record<string, any>;
}

interface VariablesButtonProps {
  nodes: WorkflowNode[];
  workflowVars: Record<string, any>;
}
export default function VariablesButton({
  nodes,
  workflowVars,
}: VariablesButtonProps) {
  const lastFocusedInput = useLastFocusedInput();
  const nodeOutputs = useMemo(() => {
    const triggerRegistry = TriggerRegistry.getInstance();
    const actionRegistry = ActionRegistry.getInstance();

    return nodes.map((node) => {
      const nodeId = node.id;
      let outputs: Record<string, any> = {};
      let icon: React.ReactNode = null;
      if (node.type === "trigger") {
        const data = node.data as TriggerNodeData;
        if (triggerRegistry.hasTrigger(data.type)) {
          const trigger = triggerRegistry.getTrigger(data.type);
          outputs = trigger!.outputExample;
          icon = <NodeIcon icon={trigger!.metadata.icon} />;
        }
      } else if (node.type === "action") {
        const data = node.data as ActionNodeData;
        if (actionRegistry.hasAction(data.type)) {
          const action = actionRegistry.getAction(data.type);
          if (action?.metadata.type === FormAction.metadata.type) {
            outputs = FormAction.getRichOutputExample(
              data.config as FormActionConfig,
            );
          } else {
            outputs = action!.outputExample;
          }
          icon = <NodeIcon icon={action!.metadata.icon} />;
        }
      }
      return {
        nodeId,
        outputs,
        icon,
      };
    });
  }, [nodes]);

  const handleVariableClick = (label: string) => {
    const target = lastFocusedInput.current;
    if (target) {
      insertAtCursor(target, label);
    } else {
      copyToClipboard(label);
      NotificationService.showNotification({
        title: "Copied to clipboard",
        message: label,
      });
    }
  };

  const getOutputMenu = (node: NodeOutputs) => {
    return (
      <Menu key={node.nodeId} trigger="hover" position="left">
        <Menu.Target>
          <Menu.Item
            leftSection={node.icon}
            onClick={() => handleVariableClick(`{{${node.nodeId}}}`)}
          >
            <Code>{node.nodeId}</Code>
          </Menu.Item>
        </Menu.Target>
        <Menu.Dropdown>
          {Object.entries(node.outputs).map(([key, value]) => {
            if (typeof value === "object" && value !== null) {
              return (
                <Menu key={key} trigger="hover" position="left">
                  <Menu.Target>
                    <Menu.Item
                      onClick={() =>
                        handleVariableClick(`{{${node.nodeId}.${key}}}`)
                      }
                    >
                      <Code>{key}</Code>
                    </Menu.Item>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {Object.keys(value).map((subKey) => (
                      <Tooltip
                        key={subKey}
                        label={<Text size="xs">{String(value)}</Text>}
                        withArrow
                        position="left"
                        color="dark"
                      >
                        <Menu.Item
                          onClick={() =>
                            handleVariableClick(
                              `{{${node.nodeId}.${key}.${subKey}}}`,
                            )
                          }
                        >
                          <Code>{subKey}</Code>
                        </Menu.Item>
                      </Tooltip>
                    ))}
                  </Menu.Dropdown>
                </Menu>
              );
            } else {
              return (
                <Tooltip
                  key={key}
                  label={<Text size="xs">{String(value)}</Text>}
                  withArrow
                  position="left"
                  color="dark"
                >
                  <Menu.Item
                    onClick={() =>
                      handleVariableClick(`{{${node.nodeId}.${key}}}`)
                    }
                  >
                    <Code>{key}</Code>
                  </Menu.Item>
                </Tooltip>
              );
            }
          })}
        </Menu.Dropdown>
      </Menu>
    );
  };

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="light">
          <IconVariable />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown mah={300} style={{ overflowY: "auto" }}>
        <Menu.Label>
          <Group gap="xs" wrap="nowrap">
            <IconVariable size={20} />
            Variables
          </Group>
        </Menu.Label>
        <Menu.Divider />
        <Menu.Label>Nodes Outputs</Menu.Label>
        {nodeOutputs.map((node) => (
          <div key={node.nodeId}>{getOutputMenu(node)}</div>
        ))}

        <Menu.Divider />
        <Menu.Label>Workflow Vars</Menu.Label>
        {Object.entries(workflowVars).map(([key, value]) => (
          <Tooltip
            key={key}
            label={<Text size="xs">{String(value)}</Text>}
            withArrow
            position="left"
            color="dark"
          >
            <Menu.Item onClick={() => handleVariableClick(`{{env.${key}}}`)}>
              <Code>{key}</Code>
            </Menu.Item>
          </Tooltip>
        ))}
        <Menu.Divider />
        <Menu.Label>Execution Details</Menu.Label>
        {Object.entries(ExecutionMetadataExamples).map(([key, example]) => (
          <Tooltip
            key={key}
            label={<Text size="xs">{example}</Text>}
            withArrow
            position="left"
            color="dark"
          >
            <Menu.Item onClick={() => handleVariableClick(`{{meta.${key}}}`)}>
              <Code>{key}</Code>
            </Menu.Item>
          </Tooltip>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
