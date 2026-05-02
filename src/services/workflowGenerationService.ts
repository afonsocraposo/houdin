import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";

import { useStore } from "@/store";
import {
  GenerationMessage,
  GenerationPromptRequest,
  GenerationPromptResponse,
  GenerationSession,
} from "@/types/generation-session";
import type {
  NodeType,
  WorkflowConnection,
  WorkflowDefinition,
  WorkflowNode,
} from "@/types/workflow";
import { generateId } from "@/utils/helpers";
import {
  buildWorkflowNodeTools,
  getNodeSchemaSummaries,
} from "./workflowGenerationNodeTools";

const openrouter = createOpenRouter({
  apiKey:
    import.meta.env.VITE_OPENROUTER_API_KEY ||
    "OPENROUTER_API_KEY_PLACEHOLDER",
  appName: "Houdin",
  appUrl: "https://houdin.dev",
});

const model = openrouter.chat("openai/gpt-oss-120b:free", {
  temperature: 0.2,
  maxTokens: 2000,
});

const triggerNodeTypes = new Set([
  "page-load",
  "component-load",
  "delay",
  "key-press",
  "http-request",
  "button-click",
  "popup",
]);

function createBaseWorkflow(): WorkflowDefinition {
  return {
    id: generateId("workflow", 12),
    name: "Untitled workflow",
    description: "",
    urlPattern: "https://*",
    nodes: [],
    connections: [],
    enabled: false,
    variables: {},
    modifiedAt: Date.now(),
  };
}

function ensureDraftWorkflow(session: GenerationSession): WorkflowDefinition {
  return session.draftWorkflow ?? createBaseWorkflow();
}

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
  const explicit = getFirstString(args, ["nodeType", "node_type", "category", "kind"]);
  return explicit === "trigger" || explicit === "action" ? explicit : null;
}

function inferNodeType(type: string, args: Record<string, any>): NodeType {
  const explicit = nodeTypeFromArgs(args);
  if (explicit) {
    return explicit;
  }

  return triggerNodeTypes.has(type) ? "trigger" : "action";
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
    x: rightmostX + 240,
    y: Math.max(80, Math.round(averageY)),
  };
}

function appendMessage(
  session: GenerationSession,
  role: GenerationMessage["role"],
  content: string,
  kind: GenerationMessage["kind"],
): GenerationSession {
  return {
    ...session,
    messages: [
      ...session.messages,
      {
        id: generateId("msg", 10),
        role,
        kind,
        content,
        createdAt: Date.now(),
      },
    ],
    updatedAt: Date.now(),
  };
}

function stripPendingThinkingMessage(session: GenerationSession): GenerationSession {
  const messages = [...session.messages];
  const lastMessage = messages[messages.length - 1];

  if (lastMessage?.role === "assistant" && lastMessage.kind === "thinking") {
    messages.pop();
  }

  return {
    ...session,
    messages,
  };
}

function historyToPrompt(messages: GenerationMessage[]): string {
  return messages
    .filter((message) => message.kind !== "thinking")
    .slice(-12)
    .map((message) => {
      const label = `${message.role}${message.kind ? `/${message.kind}` : ""}`;
      return `${label}: ${message.content}`;
    })
    .join("\n");
}

function buildSystemPrompt(session: GenerationSession): string {
  const workflow = ensureDraftWorkflow(session);
  const pageContext = session.pageContext
    ? JSON.stringify(session.pageContext, null, 2)
    : "null";
  const history = historyToPrompt(session.messages);

  return [
    "You are Houdin's workflow builder.",
    "Use the tools to build and refine the workflow incrementally.",
    "Do not return workflow JSON.",
    "Prefer small tool calls over big rewrites.",
    "If a page-specific workflow is requested, use the provided page context.",
    "",
    "Use tools in this order when needed: create node, connect nodes, then update node config.",
    "Use setWorkflowName, setWorkflowDescription, setUrlPattern, and setWorkflowEnabled for workflow-level changes.",
    "When creating nodes, use the exact node-type tool names and fields.",
    "Use getNodeSchema when you need the exact config fields for a node type.",
    "",
    `Current draft workflow: ${JSON.stringify(workflow, null, 2)}`,
    `Current page context: ${pageContext}`,
    `Recent conversation: ${history || "(empty)"}`,
    "",
    "For createNode, use: type, nodeType ('trigger' or 'action'), id, position, config, inputs, outputs.",
    "For updateNodeConfig/moveNode/deleteNode, use nodeId.",
    "For connectNodes, use sourceId and targetId.",
  ].join("\n");
}

function commitSession(
  nextWorkflow: WorkflowDefinition,
  nextSession: GenerationSession,
): GenerationSession {
  const updatedSession = {
    ...nextSession,
    draftWorkflow: nextWorkflow,
    updatedAt: Date.now(),
  };

  useStore.getState().updateWorkflow(nextWorkflow);
  useStore.getState().setActiveGenerationSession(updatedSession);

  return updatedSession;
}

function setWorkflowName(
  workflow: WorkflowDefinition,
  name: string,
): WorkflowDefinition {
  return { ...workflow, name, modifiedAt: Date.now() };
}

function setWorkflowDescription(
  workflow: WorkflowDefinition,
  description: string,
): WorkflowDefinition {
  return { ...workflow, description, modifiedAt: Date.now() };
}

function setUrlPattern(
  workflow: WorkflowDefinition,
  urlPattern: string,
): WorkflowDefinition {
  return { ...workflow, urlPattern, modifiedAt: Date.now() };
}

function setWorkflowEnabled(
  workflow: WorkflowDefinition,
  enabled: boolean,
): WorkflowDefinition {
  return { ...workflow, enabled, modifiedAt: Date.now() };
}

function createNode(
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
  const position = asPosition(args.position) || getNextNodePosition(workflow.nodes);
  const config = isRecord(args.config) ? args.config : {};
  const inputs = Array.isArray(args.inputs)
    ? args.inputs.filter((value): value is string => typeof value === "string")
    : nodeType === "trigger"
      ? []
      : ["input"];
  const outputs = Array.isArray(args.outputs)
    ? args.outputs.filter((value): value is string => typeof value === "string")
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
    result: `Created ${nodeType} node '${nodeId}' (${type}).`,
  };
}

function updateNodeConfig(
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

function moveNode(
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

function deleteNode(
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
        (connection) => connection.source !== nodeId && connection.target !== nodeId,
      ),
      modifiedAt: Date.now(),
    },
    result: `Deleted node '${nodeId}'.`,
  };
}

function connectNodes(
  workflow: WorkflowDefinition,
  args: Record<string, any>,
): { workflow: WorkflowDefinition; result: string } {
  const sourceId = getFirstString(args, ["sourceId", "source_id", "from", "source"]);
  const targetId = getFirstString(args, ["targetId", "target_id", "to", "target"]);
  const sourceHandle = getFirstString(args, ["sourceHandle", "source_handle"]);
  const targetHandle = getFirstString(args, ["targetHandle", "target_handle"]);

  if (!sourceId || !targetId) {
    throw new Error("connectNodes requires sourceId and targetId");
  }

  const connection: WorkflowConnection = {
    id: getFirstString(args, ["id", "connectionId", "connection_id"]) ||
      generateId("conn", 8),
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

function disconnectNodes(
  workflow: WorkflowDefinition,
  args: Record<string, any>,
): { workflow: WorkflowDefinition; result: string } {
  const connectionId = getFirstString(args, ["connectionId", "connection_id", "id"]);
  const sourceId = getFirstString(args, ["sourceId", "source_id", "from", "source"]);
  const targetId = getFirstString(args, ["targetId", "target_id", "to", "target"]);

  if (!connectionId && (!sourceId || !targetId)) {
    throw new Error("disconnectNodes requires connectionId or sourceId and targetId");
  }

  return {
    workflow: {
      ...workflow,
      connections: workflow.connections.filter((connection) => {
        if (connectionId) {
          return connection.id !== connectionId;
        }

        return !(connection.source === sourceId && connection.target === targetId);
      }),
      modifiedAt: Date.now(),
    },
    result: connectionId
      ? `Disconnected connection '${connectionId}'.`
      : `Disconnected '${sourceId}' from '${targetId}'.`,
  };
}

export class WorkflowGenerationService {
  private static instance: WorkflowGenerationService | null = null;

  static getInstance(): WorkflowGenerationService {
    if (!WorkflowGenerationService.instance) {
      WorkflowGenerationService.instance = new WorkflowGenerationService();
    }

    return WorkflowGenerationService.instance;
  }

  async submitPrompt(
    request: GenerationPromptRequest,
  ): Promise<GenerationPromptResponse> {
    const { session, prompt } = request;
    const cleanedSession = stripPendingThinkingMessage(session);

    let workingWorkflow = ensureDraftWorkflow(cleanedSession);
    let workingSession = appendMessage(
      cleanedSession,
      "assistant",
      "Planning workflow changes...",
      "plan",
    );

    commitSession(workingWorkflow, workingSession);

    const persist = (message: string, kind: GenerationMessage["kind"] = "tool") => {
      workingSession = appendMessage(workingSession, "assistant", message, kind);
      commitSession(workingWorkflow, workingSession);
    };

    const applyWorkflow = (nextWorkflow: WorkflowDefinition, message: string) => {
      workingWorkflow = nextWorkflow;
      persist(message, "tool");
    };

    try {
      const result = await generateText({
        model,
        system: buildSystemPrompt(workingSession),
        prompt,
        stopWhen: stepCountIs(10),
        tools: {
          setWorkflowName: tool({
            description: "Set the workflow name.",
            inputSchema: z.object({ name: z.string().min(1) }),
            execute: async ({ name }) => {
              const nextWorkflow = setWorkflowName(workingWorkflow, name);
              applyWorkflow(nextWorkflow, `Set workflow name to '${name}'.`);
              return { name };
            },
          }),
          setWorkflowDescription: tool({
            description: "Set the workflow description.",
            inputSchema: z.object({ description: z.string() }),
            execute: async ({ description }) => {
              const nextWorkflow = setWorkflowDescription(workingWorkflow, description);
              applyWorkflow(nextWorkflow, "Updated workflow description.");
              return { description };
            },
          }),
          setUrlPattern: tool({
            description: "Set the workflow URL pattern.",
            inputSchema: z.object({ urlPattern: z.string().min(1) }),
            execute: async ({ urlPattern }) => {
              const nextWorkflow = setUrlPattern(workingWorkflow, urlPattern);
              applyWorkflow(nextWorkflow, `Set URL pattern to '${urlPattern}'.`);
              return { urlPattern };
            },
          }),
          setWorkflowEnabled: tool({
            description: "Enable or disable the workflow.",
            inputSchema: z.object({ enabled: z.boolean() }),
            execute: async ({ enabled }) => {
              const nextWorkflow = setWorkflowEnabled(workingWorkflow, enabled);
              applyWorkflow(nextWorkflow, `Set workflow enabled to ${enabled}.`);
              return { enabled };
            },
          }),
          getNodeSchema: tool({
            description:
              "Inspect the exact config schema for a trigger or action type before creating a node.",
            inputSchema: z.object({
              type: z.string().min(1),
            }),
            execute: async ({ type }) => {
              const schema = getNodeSchemaSummaries().find(
                (item) => item.type === type,
              );

              if (!schema) {
                throw new Error(`Node schema not found for '${type}'`);
              }

              persist(
                `Schema for ${schema.kind} '${schema.type}': ${schema.fields
                  .map(
                    (field) =>
                      `${field.name} (${field.type}${field.required ? ", required" : ""})`,
                  )
                  .join(", ")}`,
                "tool",
              );

              return schema;
            },
          }),
          ...buildWorkflowNodeTools({
            getWorkflow: () => workingWorkflow,
            createNode: (args) => createNode(workingWorkflow, args),
            commitWorkflow: (nextWorkflow, message) => {
              workingWorkflow = nextWorkflow;
              persist(message, "tool");
              workingSession = {
                ...workingSession,
                draftWorkflow: nextWorkflow,
              };
              commitSession(workingWorkflow, workingSession);
            },
          }),
          updateNodeConfig: tool({
            description: "Update an existing node config.",
            inputSchema: z.object({
              nodeId: z.string().optional(),
              node_id: z.string().optional(),
              targetNodeId: z.string().optional(),
              id: z.string().optional(),
              config: z.record(z.string(), z.any()).optional(),
              patch: z.record(z.string(), z.any()).optional(),
            }),
            execute: async (args) => {
              const { workflow: nextWorkflow, result: message } = updateNodeConfig(
                workingWorkflow,
                args,
              );
              applyWorkflow(nextWorkflow, message);
              return { message };
            },
          }),
          moveNode: tool({
            description: "Move an existing node.",
            inputSchema: z.object({
              nodeId: z.string().optional(),
              node_id: z.string().optional(),
              targetNodeId: z.string().optional(),
              id: z.string().optional(),
              position: z.object({ x: z.number(), y: z.number() }),
            }),
            execute: async (args) => {
              const { workflow: nextWorkflow, result: message } = moveNode(
                workingWorkflow,
                args,
              );
              applyWorkflow(nextWorkflow, message);
              return { message };
            },
          }),
          deleteNode: tool({
            description: "Delete a node and its connections.",
            inputSchema: z.object({
              nodeId: z.string().optional(),
              node_id: z.string().optional(),
              targetNodeId: z.string().optional(),
              id: z.string().optional(),
            }),
            execute: async (args) => {
              const { workflow: nextWorkflow, result: message } = deleteNode(
                workingWorkflow,
                args,
              );
              applyWorkflow(nextWorkflow, message);
              return { message };
            },
          }),
          connectNodes: tool({
            description: "Connect two nodes in the workflow.",
            inputSchema: z.object({
              sourceId: z.string().optional(),
              source_id: z.string().optional(),
              from: z.string().optional(),
              targetId: z.string().optional(),
              target_id: z.string().optional(),
              to: z.string().optional(),
              sourceHandle: z.string().optional(),
              targetHandle: z.string().optional(),
              id: z.string().optional(),
            }),
            execute: async (args) => {
              const { workflow: nextWorkflow, result: message } = connectNodes(
                workingWorkflow,
                args,
              );
              applyWorkflow(nextWorkflow, message);
              return { message };
            },
          }),
          disconnectNodes: tool({
            description: "Disconnect nodes or remove a connection.",
            inputSchema: z.object({
              connectionId: z.string().optional(),
              connection_id: z.string().optional(),
              id: z.string().optional(),
              sourceId: z.string().optional(),
              source_id: z.string().optional(),
              from: z.string().optional(),
              targetId: z.string().optional(),
              target_id: z.string().optional(),
              to: z.string().optional(),
            }),
            execute: async (args) => {
              const { workflow: nextWorkflow, result: message } = disconnectNodes(
                workingWorkflow,
                args,
              );
              applyWorkflow(nextWorkflow, message);
              return { message };
            },
          }),
        },
      });

      const finalText = result.text.trim() || "Workflow updated.";
      workingSession = appendMessage(
        workingSession,
        "assistant",
        finalText,
        "result",
      );
      commitSession(workingWorkflow, workingSession);

      return { session: workingSession };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate workflow.";

      workingSession = appendMessage(
        workingSession,
        "assistant",
        errorMessage,
        "error",
      );
      workingSession = { ...workingSession, status: "failed" };
      commitSession(workingWorkflow, workingSession);

      return { session: workingSession };
    }
  }
}
