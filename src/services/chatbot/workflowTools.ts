import {
  ExecutionMetadataKeys,
  WorkflowConnection,
  WorkflowDefinition,
  WorkflowNode,
} from "@/types/workflow";
import { NodeType, WorkflowExecution } from "@/types/workflow";
import { validateConfig } from "@/types/config-properties";
import { getNodeDefinition, triggerCatalog } from "../nodeCatalog";
import { useStore } from "@/store";
import { generateId, newConnectionId } from "@/utils/helpers";

export type WorkflowValidationReport = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: string;
};

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

function getNodeDataType(node: WorkflowNode): string {
  return node.data && "type" in node.data && typeof node.data.type === "string"
    ? node.data.type
    : "unknown";
}

function getNodeConfig(node: WorkflowNode): Record<string, any> {
  return isRecord(node.data?.config) ? node.data.config : {};
}

function looksLikeNodeId(value: string): boolean {
  return /^(action|trigger)-/.test(value.trim());
}

function isLikelyNodeReference(value: string, workflow: WorkflowDefinition): boolean {
  return (
    workflow.nodes.some((node) => node.id === value) || looksLikeNodeId(value)
  );
}

function collectStringFields(
  value: unknown,
  path: string,
): Array<{ path: string; value: string }> {
  if (typeof value === "string") {
    return [{ path, value }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectStringFields(item, `${path}[${index}]`),
    );
  }

  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, nestedValue]) =>
      collectStringFields(nestedValue, path ? `${path}.${key}` : key),
    );
  }

  return [];
}

function hasValidLiquidSyntax(value: string): boolean {
  let depth = 0;

  for (let index = 0; index < value.length - 1; index += 1) {
    const pair = value.slice(index, index + 2);
    if (pair === "{{") {
      if (depth !== 0) {
        return false;
      }
      depth = 1;
      index += 1;
      continue;
    }

    if (pair === "}}") {
      if (depth !== 1) {
        return false;
      }
      depth = 0;
      index += 1;
    }
  }

  return depth === 0;
}

function extractLiquidReferences(value: string): string[] {
  return Array.from(value.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g), (match) =>
    match[1].trim(),
  );
}

function getNestedValue(value: unknown, path: string[]): unknown {
  let current = value;

  for (const segment of path) {
    if (!isRecord(current) || !(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

function validateNodeReference(
  workflow: WorkflowDefinition,
  ref: string,
): { error?: string; warning?: string } {
  const [nodeId, ...propertyPath] = ref.split(".");

  if (nodeId === "page") {
    return {
      error:
        ref === "page.url"
          ? "uses invalid variable '{{page.url}}'. Use '{{meta.url}}' for the current page URL."
          : `uses invalid variable namespace 'page'. Use 'meta' for execution metadata. Available metadata fields: ${ExecutionMetadataKeys.join(", ")}`,
    };
  }

  if (nodeId === "meta") {
    const [metadataKey] = propertyPath;
    if (!metadataKey) {
      return {
        warning: `references metadata namespace 'meta' without a field. Available metadata fields: ${ExecutionMetadataKeys.join(", ")}`,
      };
    }

    if (!ExecutionMetadataKeys.includes(metadataKey as any)) {
      return {
        error: `references invalid metadata field 'meta.${metadataKey}'. Available metadata fields: ${ExecutionMetadataKeys.join(", ")}`,
      };
    }

    return {};
  }

  if (nodeId === "env" || nodeId === "prev") {
    return {};
  }

  if (!isLikelyNodeReference(nodeId, workflow)) {
    return {};
  }

  const sourceNode = workflow.nodes.find((node) => node.id === nodeId);
  if (!sourceNode) {
    return {
      error: `references non-existent node '${nodeId}'`,
    };
  }

  if (propertyPath.length === 0) {
    return {
      warning: `references node '${nodeId}' without an output property. Prefer {{${nodeId}.property}} after checking getNodeSchema.`,
    };
  }

  const sourceType = getNodeDataType(sourceNode);
  const definition = getNodeDefinition(sourceNode.type, sourceType);
  const outputExample = definition?.outputExample;

  if (!outputExample || !isRecord(outputExample)) {
    return {
      warning: `references '${nodeId}.${propertyPath.join(".")}', but node type '${sourceType}' does not expose an output example to validate against`,
    };
  }

  if (getNestedValue(outputExample, propertyPath) !== undefined) {
    return {};
  }

  const availableProperties = Object.keys(outputExample);
  return {
    error: availableProperties.length > 0
      ? `references invalid property '${propertyPath.join(".")}' on node '${nodeId}' (type '${sourceType}'). Available properties: ${availableProperties.join(", ")}`
      : `references invalid property '${propertyPath.join(".")}' on node '${nodeId}' (type '${sourceType}')`,
  };
}

type ConfigValidationOptions = {
  allowMissingReferencedNodes: boolean;
};

function validateConfigVariables(
  workflow: WorkflowDefinition,
  config: Record<string, any>,
  options: ConfigValidationOptions,
): { errors: string[]; warnings: string[]; hasLiquidReferences: boolean } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let hasLiquidReferences = false;

  for (const field of collectStringFields(config, "config")) {
    if (!hasValidLiquidSyntax(field.value)) {
      errors.push(
        `${field.path} contains malformed Liquid syntax: ${JSON.stringify(field.value)}`,
      );
      continue;
    }

    for (const ref of extractLiquidReferences(field.value)) {
      hasLiquidReferences = true;
      const validation = validateNodeReference(workflow, ref);

      if (validation.error) {
        if (
          options.allowMissingReferencedNodes &&
          validation.error.startsWith("references non-existent node")
        ) {
          warnings.push(`${field.path} ${validation.error}`);
          continue;
        }

        errors.push(`${field.path} ${validation.error}`);
      }

      if (validation.warning) {
        warnings.push(`${field.path} ${validation.warning}`);
      }
    }
  }

  return { errors, warnings, hasLiquidReferences };
}

function validateNodeConfigAgainstSchema(node: WorkflowNode): string[] {
  const definition = getNodeDefinition(node.type, getNodeDataType(node));
  if (!definition) {
    return [
      `Node '${node.id}' uses unknown ${node.type} type '${getNodeDataType(node)}'`,
    ];
  }

  const config = getNodeConfig(node);
  const allowedKeys = new Set(Object.keys(definition.configSchema.properties));
  const unknownKeys = Object.keys(config).filter((key) => !allowedKeys.has(key));

  const unknownKeyErrors = unknownKeys.map(
    (key) =>
      `Node '${node.id}' config '${key}' is not supported for node type '${getNodeDataType(node)}'. Allowed fields: ${Array.from(allowedKeys).join(", ")}`,
  );

  const result = validateConfig(config, definition.configSchema);
  return [
    ...unknownKeyErrors,
    ...Object.entries(result.errors).flatMap(([field, fieldErrors]) =>
      (fieldErrors as string[]).map(
        (error) => `Node '${node.id}' config '${field}': ${error}`,
      ),
    ),
  ];
}

function validateConfigPatchKeys(node: WorkflowNode, patch: Record<string, any>) {
  const definition = getNodeDefinition(node.type, getNodeDataType(node));
  if (!definition) {
    return;
  }

  const allowedKeys = new Set(Object.keys(definition.configSchema.properties));
  const unknownKeys = Object.keys(patch).filter((key) => !allowedKeys.has(key));

  if (unknownKeys.length > 0) {
    throw new Error(
      `Node '${node.id}' (${getNodeDataType(node)}) does not support config field(s): ${unknownKeys.join(", ")}. Allowed fields: ${Array.from(allowedKeys).join(", ")}`,
    );
  }
}

function buildValidationSummary(errors: string[], warnings: string[]): string {
  if (errors.length === 0 && warnings.length === 0) {
    return "Workflow is valid and ready to enable.";
  }

  if (errors.length === 0) {
    return `Workflow is valid but has ${warnings.length} warning(s).`;
  }

  return `Workflow has ${errors.length} error(s) and ${warnings.length} warning(s).`;
}

export function validateWorkflow(
  workflow: WorkflowDefinition,
): WorkflowValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const triggerNodes = workflow.nodes.filter((node) => node.type === "trigger");
  if (triggerNodes.length === 0) {
    errors.push(
      "Workflow has no trigger nodes. Add at least one trigger before enabling it.",
    );
  }

  for (const node of workflow.nodes) {
    errors.push(...validateNodeConfigAgainstSchema(node));

    const variableValidation = validateConfigVariables(
      workflow,
      getNodeConfig(node),
      { allowMissingReferencedNodes: false },
    );
    errors.push(
      ...variableValidation.errors.map((error) => `Node '${node.id}' ${error}`),
    );
    warnings.push(
      ...variableValidation.warnings.map(
        (warning) => `Node '${node.id}' ${warning}`,
      ),
    );
  }

  for (const node of workflow.nodes) {
    if (node.type !== "action") {
      continue;
    }

    const hasIncoming = workflow.connections.some(
      (connection) => connection.target === node.id,
    );
    if (!hasIncoming) {
      warnings.push(
        `Action node '${node.id}' (${getNodeDataType(node)}) has no incoming connections and will never execute.`,
      );
    }
  }

  const reachable = new Set<string>();
  const queue = triggerNodes.map((node) => node.id);

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || reachable.has(nodeId)) {
      continue;
    }

    reachable.add(nodeId);
    for (const connection of workflow.connections) {
      if (connection.source === nodeId) {
        queue.push(connection.target);
      }
    }
  }

  for (const node of workflow.nodes) {
    if (!reachable.has(node.id)) {
      warnings.push(
        `Node '${node.id}' (${getNodeDataType(node)}) is unreachable from any trigger.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: buildValidationSummary(errors, warnings),
  };
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
    throw new Error(
      "createNode requires a node type such as 'page-load', 'get-element-content', or 'write-clipboard'",
    );
  }

  const nodeType = inferNodeType(type, args);
  const definition = getNodeDefinition(nodeType, type);
  if (!definition) {
    throw new Error(`Unknown ${nodeType} node type '${type}'`);
  }

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

  validateConfigPatchKeys(node, config);

  const variableValidation = validateConfigVariables(workflow, config, {
    allowMissingReferencedNodes: true,
  });
  if (variableValidation.errors.length > 0) {
    throw new Error(variableValidation.errors.join("; "));
  }

  return {
    workflow: {
      ...workflow,
      nodes: [...workflow.nodes, node],
      modifiedAt: Date.now(),
    },
    result: [
      `Created ${nodeType} node '${type}' (${nodeId}).`,
      variableValidation.hasLiquidReferences
        ? "Config uses Liquid variables. After wiring the workflow, call validateWorkflow to verify node references and output properties, and keep validation as your final workflow step before enabling it or declaring the workflow finished."
        : null,
      ...variableValidation.warnings,
    ]
      .filter(Boolean)
      .join(" "),
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
    throw new Error(
      "updateNodeConfig requires a config or patch object together with the target node id",
    );
  }

  const variableValidation = validateConfigVariables(workflow, patch, {
    allowMissingReferencedNodes: true,
  });
  if (variableValidation.errors.length > 0) {
    throw new Error(variableValidation.errors.join("; "));
  }

  const targetNode = workflow.nodes.find((node) => node.id === nodeId);
  if (!targetNode) {
    const availableNodeIds = workflow.nodes.map((node) => node.id).join(", ");
    throw new Error(
      availableNodeIds
        ? `Node '${nodeId}' not found. Available node ids: ${availableNodeIds}`
        : `Node '${nodeId}' not found because the workflow currently has no nodes. Create the node first or call getWorkflow to inspect the current state.`,
    );
  }

  validateConfigPatchKeys(targetNode, patch);

  const nodes = workflow.nodes.map((node) => {
    if (node.id !== nodeId) {
      return node;
    }

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

  return {
    workflow: {
      ...workflow,
      nodes,
      modifiedAt: Date.now(),
    },
    result: [
      `Updated config for node '${nodeId}'.`,
      variableValidation.hasLiquidReferences
        ? "Config uses Liquid variables. After wiring the workflow, call validateWorkflow to verify node references and output properties, and keep validation as your final workflow step before enabling it or declaring the workflow finished."
        : null,
      ...variableValidation.warnings,
    ]
      .filter(Boolean)
      .join(" "),
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
  const sourceHandle = getFirstString(args, ["sourceHandle", "source_handle"]) || "output";
  const targetHandle = getFirstString(args, ["targetHandle", "target_handle"]) || "input";

  if (!sourceId || !targetId) {
    throw new Error("connectNodes requires sourceId and targetId");
  }

  if (!workflow.nodes.some((node) => node.id === sourceId)) {
    throw new Error(`connectNodes could not find source node '${sourceId}'`);
  }

  if (!workflow.nodes.some((node) => node.id === targetId)) {
    throw new Error(`connectNodes could not find target node '${targetId}'`);
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
