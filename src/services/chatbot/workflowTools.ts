import {
  WorkflowConnection,
  WorkflowDefinition,
  WorkflowNode,
} from "@/types/workflow";
import { NodeType, WorkflowExecution } from "@/types/workflow";
import { triggerCatalog } from "../nodeCatalog";
import { useStore } from "@/store";
import { generateId, newConnectionId } from "@/utils/helpers";

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getFirstString(
  args: Record<string, any>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = asString(args[key]);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function asPosition(value: unknown): { x: number; y: number } | undefined {
  if (
    isRecord(value) &&
    typeof value.x === "number" &&
    typeof value.y === "number"
  ) {
    return { x: value.x, y: value.y };
  }

  return undefined;
}

function nodeTypeFromArgs(args: Record<string, any>): NodeType | null {
  const explicit = getFirstString(args, [
    "nodeType",
    "node_type",
    "category",
    "kind",
  ]);
  return explicit === "trigger" || explicit === "action" ? explicit : null;
}

export function inferNodeType(
  type: string,
  args: Record<string, any>,
): NodeType {
  const explicit = nodeTypeFromArgs(args);
  if (explicit) {
    return explicit;
  }

  return triggerCatalog[type] ? "trigger" : "action";
}

function getNextNodePosition(nodes: WorkflowNode[]): { x: number; y: number } {
  if (nodes.length === 0) {
    return { x: 280, y: 120 };
  }

  const rightmostX = nodes.reduce(
    (max, node) => Math.max(max, node.position.x),
    nodes[0].position.x,
  );
  const averageY =
    nodes.reduce((sum, node) => sum + node.position.y, 0) / nodes.length;

  return {
    x: rightmostX + 300,
    y: Math.max(80, Math.round(averageY)),
  };
}

export function getLatestExecution(
  workflowId: string,
): WorkflowExecution | null {
  const executions = useStore.getState().executions;
  for (let index = executions.length - 1; index >= 0; index -= 1) {
    if (executions[index]?.workflowId === workflowId) {
      return executions[index];
    }
  }

  return null;
}

export function setWorkflowName(
  workflow: WorkflowDefinition,
  name: string,
): WorkflowDefinition {
  return { ...workflow, name, modifiedAt: Date.now() };
}

export function setWorkflowDescription(
  workflow: WorkflowDefinition,
  description: string,
): WorkflowDefinition {
  return { ...workflow, description, modifiedAt: Date.now() };
}

export function setUrlPattern(
  workflow: WorkflowDefinition,
  urlPattern: string,
): WorkflowDefinition {
  return { ...workflow, urlPattern, modifiedAt: Date.now() };
}

export function setWorkflowEnabled(
  workflow: WorkflowDefinition,
  enabled: boolean,
): WorkflowDefinition {
  return { ...workflow, enabled, modifiedAt: Date.now() };
}

export function createNode(
  workflow: WorkflowDefinition,
  args: Record<string, any>,
): { workflow: WorkflowDefinition; result: string } {
  const type = getFirstString(args, ["type", "actionType", "triggerType"]);
  if (!type) {
    throw new Error("createNode requires type");
  }

  const nodeType = inferNodeType(type, args);
  const nodeId =
    getFirstString(args, ["id", "nodeId", "node_id"]) ||
    generateId(nodeType, 8);
  const position =
    asPosition(args.position) || getNextNodePosition(workflow.nodes);
  const config = isRecord(args.config) ? args.config : {};
  const inputs =
    Array.isArray(args.inputs) && args.inputs.length > 0
      ? args.inputs.filter(
          (value): value is string => typeof value === "string",
        )
      : nodeType === "trigger"
        ? []
        : ["input"];
  const outputs =
    Array.isArray(args.outputs) && args.outputs.length > 0
      ? args.outputs.filter(
          (value): value is string => typeof value === "string",
        )
      : ["output"];

  const node: WorkflowNode = {
    id: nodeId,
    type: nodeType,
    position,
    data: { type, config },
    inputs,
    outputs,
  };

  return {
    workflow: {
      ...workflow,
      nodes: [...workflow.nodes, node],
      modifiedAt: Date.now(),
    },
    result: `Created ${nodeType} node '${type}' (${nodeId}).`,
  };
}

export function updateNodeConfig(
  workflow: WorkflowDefinition,
  args: Record<string, any>,
): { workflow: WorkflowDefinition; result: string } {
  const nodeId = getFirstString(args, [
    "nodeId",
    "node_id",
    "targetNodeId",
    "target_node_id",
    "id",
  ]);
  if (!nodeId) {
    throw new Error("updateNodeConfig requires nodeId");
  }

  const patch = isRecord(args.config)
    ? args.config
    : isRecord(args.patch)
      ? args.patch
      : null;
  if (!patch) {
    throw new Error("updateNodeConfig requires config or patch");
  }

  let updated = false;
  const nodes = workflow.nodes.map((node) => {
    if (node.id !== nodeId) {
      return node;
    }

    updated = true;
    return {
      ...node,
      data: {
        ...node.data,
        config: {
          ...(node.data as any).config,
          ...patch,
        },
      },
    };
  });

  if (!updated) {
    throw new Error(`Node '${nodeId}' not found`);
  }

  return {
    workflow: {
      ...workflow,
      nodes,
      modifiedAt: Date.now(),
    },
    result: `Updated config for node '${nodeId}'.`,
  };
}

export function moveNode(
  workflow: WorkflowDefinition,
  args: Record<string, any>,
): { workflow: WorkflowDefinition; result: string } {
  const nodeId = getFirstString(args, [
    "nodeId",
    "node_id",
    "targetNodeId",
    "target_node_id",
    "id",
  ]);
  const position = asPosition(args.position);

  if (!nodeId) {
    throw new Error("moveNode requires nodeId");
  }
  if (!position) {
    throw new Error("moveNode requires position { x, y }");
  }

  let updated = false;
  const nodes = workflow.nodes.map((node) => {
    if (node.id !== nodeId) {
      return node;
    }

    updated = true;
    return { ...node, position };
  });

  if (!updated) {
    throw new Error(`Node '${nodeId}' not found`);
  }

  return {
    workflow: {
      ...workflow,
      nodes,
      modifiedAt: Date.now(),
    },
    result: `Moved node '${nodeId}'.`,
  };
}

export function deleteNode(
  workflow: WorkflowDefinition,
  args: Record<string, any>,
): { workflow: WorkflowDefinition; result: string } {
  const nodeId = getFirstString(args, [
    "nodeId",
    "node_id",
    "targetNodeId",
    "target_node_id",
    "id",
  ]);
  if (!nodeId) {
    throw new Error("deleteNode requires nodeId");
  }

  if (!workflow.nodes.some((node) => node.id === nodeId)) {
    throw new Error(`Node '${nodeId}' not found`);
  }

  return {
    workflow: {
      ...workflow,
      nodes: workflow.nodes.filter((node) => node.id !== nodeId),
      connections: workflow.connections.filter(
        (connection) =>
          connection.source !== nodeId && connection.target !== nodeId,
      ),
      modifiedAt: Date.now(),
    },
    result: `Deleted node '${nodeId}'.`,
  };
}

export function connectNodes(
  workflow: WorkflowDefinition,
  args: Record<string, any>,
): { workflow: WorkflowDefinition; result: string } {
  const sourceId = getFirstString(args, [
    "sourceId",
    "source_id",
    "from",
    "source",
  ]);
  const targetId = getFirstString(args, [
    "targetId",
    "target_id",
    "to",
    "target",
  ]);
  const sourceHandle = getFirstString(args, ["sourceHandle", "source_handle"]);
  const targetHandle = getFirstString(args, ["targetHandle", "target_handle"]);

  if (!sourceId || !targetId) {
    throw new Error("connectNodes requires sourceId and targetId");
  }

  const connection: WorkflowConnection = {
    id:
      getFirstString(args, ["id", "connectionId", "connection_id"]) ||
      newConnectionId(),
    source: sourceId,
    target: targetId,
    sourceHandle,
    targetHandle,
  };

  const exists = workflow.connections.some(
    (item) =>
      item.source === connection.source &&
      item.target === connection.target &&
      item.sourceHandle === connection.sourceHandle &&
      item.targetHandle === connection.targetHandle,
  );

  if (exists) {
    return {
      workflow,
      result: `Connection from '${sourceId}' to '${targetId}' already exists.`,
    };
  }

  return {
    workflow: {
      ...workflow,
      connections: [...workflow.connections, connection],
      modifiedAt: Date.now(),
    },
    result: `Connected '${sourceId}' to '${targetId}'.`,
  };
}

export function disconnectNodes(
  workflow: WorkflowDefinition,
  args: Record<string, any>,
): { workflow: WorkflowDefinition; result: string } {
  const connectionId = getFirstString(args, [
    "connectionId",
    "connection_id",
    "id",
  ]);
  const sourceId = getFirstString(args, [
    "sourceId",
    "source_id",
    "from",
    "source",
  ]);
  const targetId = getFirstString(args, [
    "targetId",
    "target_id",
    "to",
    "target",
  ]);

  if (!connectionId && (!sourceId || !targetId)) {
    throw new Error(
      "disconnectNodes requires connectionId or sourceId and targetId",
    );
  }

  return {
    workflow: {
      ...workflow,
      connections: workflow.connections.filter((connection) => {
        if (connectionId) {
          return connection.id !== connectionId;
        }

        return !(
          connection.source === sourceId && connection.target === targetId
        );
      }),
      modifiedAt: Date.now(),
    },
    result: connectionId
      ? `Disconnected connection '${connectionId}'.`
      : `Disconnected '${sourceId}' from '${targetId}'.`,
  };
}
