import { createOpenAI } from "@ai-sdk/openai";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";

import { API_BASE_URL } from "@/api/client";
import { useStore } from "@/store";
import { getNodeDefinition, nodeCatalog } from "./nodeCatalog";
import {
  GenerationMessage,
  GenerationPromptResponse,
  GenerationSession,
} from "@/types/generation-session";
import type { WorkflowDefinition } from "@/types/workflow";
import { generateId, newWorkflowId } from "@/utils/helpers";
import {
  buildWorkflowNodeTools,
  getNodeSchema,
} from "./workflowGenerationNodeTools";
import {
  connectNodes,
  createNode,
  deleteNode,
  disconnectNodes,
  getLatestExecution,
  inferNodeType,
  moveNode,
  setUrlPattern,
  setWorkflowDescription,
  setWorkflowEnabled,
  setWorkflowName,
  updateNodeConfig,
} from "./workflowTools";

const houdinAI = createOpenAI({
  baseURL: `${API_BASE_URL}/ai`,
  apiKey: "houdin-client",
});

const model = houdinAI.chat("");

function createBaseWorkflow(): WorkflowDefinition {
  return {
    id: newWorkflowId(),
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

function createInitialSession(workflowId: string): GenerationSession {
  const now = Date.now();

  return {
    id: generateId("session", 10),
    status: "idle",
    workflowId,
    messages: [],
    pageContext: null,
    executionRefs: [],
    revision: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function ensureWorkflow(workflowId: string): WorkflowDefinition {
  return useStore.getState().readWorkflow(workflowId) || {
    ...createBaseWorkflow(),
    id: workflowId,
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

function stripPendingThinkingMessage(
  session: GenerationSession,
): GenerationSession {
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

function summarizeValue(value: any): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string")
    return JSON.stringify(
      value.length > 80 ? `${value.slice(0, 77)}...` : value,
    );
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) return `[Array(${value.length})]`;
  if (typeof value === "object")
    return `{${Object.keys(value).slice(0, 8).join(", ")}${Object.keys(value).length > 8 ? ", ..." : ""}}`;
  return String(value);
}

function summarizeObject(value: Record<string, any>): string {
  return Object.entries(value)
    .map(([key, item]) => `${key}: ${summarizeValue(item)}`)
    .join(", ");
}

function buildNodeVariableReference(): string {
  const actionSummaries = Object.values(nodeCatalog.actions).map((node) => {
    const example = node.outputExample;
    return `${node.metadata.type} -> ${typeof example === "object" && example !== null ? summarizeObject(example as Record<string, any>) : summarizeValue(example)}`;
  });

  const triggerSummaries = Object.values(nodeCatalog.triggers).map((node) => {
    const example = node.outputExample;
    return `${node.metadata.type} -> ${typeof example === "object" && example !== null ? summarizeObject(example as Record<string, any>) : summarizeValue(example)}`;
  });

  return [
    "CRITICAL: To reference another node's output in a config field, ALWAYS use {{prev}} (the node directly before this one) or the node's actual ID like {{action-abc123}} or {{action-abc123.propertyName}}.",
    "NEVER reference by the node's type name (e.g. 'http-request', 'http-response', 'show-modal' are NOT valid variables).",
    "NEVER invent property names — use getNodeSchema on the source node's type to see its output structure and pick the correct property.",
    "env.* and meta.* are also available (e.g. {{meta.url}}).",
    "",
    "Output shapes by node type:",
    ...actionSummaries.map((line) => `action: ${line}`),
    ...triggerSummaries.map((line) => `trigger: ${line}`),
  ].join("\n");
}

function buildSystemPrompt(
  session: GenerationSession,
  workflow: WorkflowDefinition,
): string {
  const pageContext = session.pageContext
    ? JSON.stringify(session.pageContext, null, 2)
    : "null";
  const history = historyToPrompt(session.messages);
  const availableNodeTypes = {
    actions: Object.values(nodeCatalog.actions).map((node) => ({
      type: node.metadata.type,
      label: node.metadata.label,
      description: node.metadata.description,
    })),
    triggers: Object.values(nodeCatalog.triggers).map((node) => ({
      type: node.metadata.type,
      label: node.metadata.label,
      description: node.metadata.description,
    })),
  };

  return [
    "You are Houdin's workflow builder.",
    "Use the tools to build and refine the workflow incrementally.",
    "Do not return workflow JSON.",
    "Prefer small tool calls over big rewrites.",
    "If a page-specific workflow is requested, use the provided page context.",
    "If selectedElement is present in the page context, prefer it as the primary target for page interactions and provided components.",
    "",
    "Diagnosing issues: When the user asks why a workflow didn't work, asks to check the execution, or reports unexpected behavior: call getLatestExecution before touching anything else. Do NOT skip to getNodeSchema or updateNodeConfig until after you've checked the execution.",
    "",
    "Building workflows: Use tools in this order when needed: create node, update node config, then connect nodes.",
    "Use setWorkflowName, setWorkflowDescription, setUrlPattern, and setWorkflowEnabled for workflow-level changes.",
    "When the workflow is ready, set a clear workflow name and enable it.",
    "When creating nodes, use the exact node-type tool names and fields.",
    "Workflow variables use Liquid syntax. Use '{{ variableName }}' placeholders in string fields for runtime substitution.",
    buildNodeVariableReference(),
    "Node IDs are generated automatically by the app as action-* or trigger-*; do not invent node IDs.",
    "Use getNodeSchema to inspect a node type's config fields AND its output structure. Call it on the source node's type when you need to know what properties to reference in a Liquid variable (e.g. getNodeSchema for 'http-request' shows the output has status, data, headers, etc. so you can use {{action-abc.data}}).",
    `Available node types: ${JSON.stringify(availableNodeTypes)}`,
    "",
    `Current workflow: ${JSON.stringify(workflow, null, 2)}`,
    `Current page context: ${pageContext}`,
    `Recent conversation: ${history || "(empty)"}`,
    "",
    "For createNode, use: type, nodeType ('trigger' or 'action'), id, position, config, inputs, outputs.",
    "For updateNodeConfig/moveNode/deleteNode, use nodeId.",
    "For connectNodes, use sourceId, targetId, sourceHandle (must match source node's outputs — typically 'output'), targetHandle (must match target node's inputs — typically 'input'). Do NOT invent handle names like 'success' or 'error'.",
  ].join("\n");
}

function commitSession(
  nextWorkflow: WorkflowDefinition,
  nextSession: GenerationSession,
): GenerationSession {
  const updatedSession = {
    ...nextSession,
    workflowId: nextWorkflow.id,
    updatedAt: Date.now(),
  } as GenerationSession;

  useStore.getState().updateWorkflow(nextWorkflow);
  useStore.getState().setSessionForWorkflow(nextWorkflow.id, updatedSession);

  return updatedSession;
}

function finalizeGeneratedWorkflow(
  workflow: WorkflowDefinition,
  prompt: string,
): WorkflowDefinition {
  let nextWorkflow = workflow;

  if (!nextWorkflow.enabled) {
    nextWorkflow = setWorkflowEnabled(nextWorkflow, true);
  }

  if (!nextWorkflow.name || nextWorkflow.name === "Untitled workflow") {
    nextWorkflow = setWorkflowName(nextWorkflow, deriveWorkflowName(prompt));
  }

  return nextWorkflow;
}

function deriveWorkflowName(prompt: string): string {
  const words = prompt
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 6)
    .join(" ");

  if (!words) {
    return "Generated workflow";
  }

  return words.length > 48 ? `${words.slice(0, 45).trimEnd()}...` : words;
}

function buildAIRequestMetadata(session: GenerationSession) {
  const workflowId = session.workflowId ?? "new-workflow";

  return {
    source: "workflow-builder",
    sessionId: session.id,
    workflowId,
  };
}

export class WorkflowGenerationService {
  private readonly workflowId: string;

  private abortController: AbortController | null = null;

  constructor(workflowId: string) {
    this.workflowId = workflowId;

    const store = useStore.getState();
    if (!store.getGenerationSessionForWorkflow(workflowId)) {
      store.setSessionForWorkflow(workflowId, createInitialSession(workflowId));
    }
  }

  stop(): { stopped: boolean } {
    if (!this.abortController) {
      return { stopped: false };
    }

    this.abortController.abort();
    return { stopped: true };
  }

  async submitPrompt(prompt: string): Promise<GenerationPromptResponse> {
    const currentSession = useStore
      .getState()
      .getGenerationSessionForWorkflow(this.workflowId);
    const cleanedSession = stripPendingThinkingMessage(
      currentSession ?? createInitialSession(this.workflowId),
    );
    const controller = new AbortController();
    this.abortController = controller;
    const requestMetadata = buildAIRequestMetadata(cleanedSession);

    let workflow = ensureWorkflow(this.workflowId);
    let workingSession = cleanedSession;

    const ensureNotAborted = () => {
      if (controller.signal.aborted) {
        throw new Error("AI generation stopped.");
      }
    };

    const persist = (
      message: string,
      kind: GenerationMessage["kind"] = "tool",
    ) => {
      ensureNotAborted();
      workingSession = appendMessage(
        workingSession,
        "assistant",
        message,
        kind,
      );
      commitSession(workflow, workingSession);
    };

    const applyWorkflow = (
      nextWorkflow: WorkflowDefinition,
      message: string,
    ) => {
      ensureNotAborted();
      workflow = nextWorkflow;
      persist(message, "tool");
    };

    try {
      const result = await generateText({
        model,
        system: buildSystemPrompt(workingSession, workflow),
        prompt,
        abortSignal: controller.signal,
        temperature: 0.2,
        maxOutputTokens: 2000,
        headers: {
          "X-Houdin-AI-Source": requestMetadata.source,
          "X-Houdin-AI-Session-Id": requestMetadata.sessionId,
          "X-Houdin-AI-Workflow-Id": requestMetadata.workflowId,
        },
        providerOptions: {
          openai: {
            metadata: requestMetadata,
          },
        },
        stopWhen: stepCountIs(10),
        tools: {
          setWorkflowName: tool({
            description: "Set the workflow name.",
            inputSchema: z.object({ name: z.string().min(1) }),
            execute: async ({ name }) => {
              ensureNotAborted();
              const nextWorkflow = setWorkflowName(workflow, name);
              applyWorkflow(nextWorkflow, `Set workflow name to '${name}'.`);
              return { name };
            },
          }),
          setWorkflowDescription: tool({
            description: "Set the workflow description.",
            inputSchema: z.object({ description: z.string() }),
            execute: async ({ description }) => {
              ensureNotAborted();
              const nextWorkflow = setWorkflowDescription(
                workflow,
                description,
              );
              applyWorkflow(nextWorkflow, "Updated workflow description.");
              return { description };
            },
          }),
          setUrlPattern: tool({
            description: "Set the workflow URL pattern.",
            inputSchema: z.object({ urlPattern: z.string().min(1) }),
            execute: async ({ urlPattern }) => {
              ensureNotAborted();
              const nextWorkflow = setUrlPattern(workflow, urlPattern);
              applyWorkflow(
                nextWorkflow,
                `Set URL pattern to '${urlPattern}'.`,
              );
              return { urlPattern };
            },
          }),
          setWorkflowEnabled: tool({
            description: "Enable or disable the workflow.",
            inputSchema: z.object({ enabled: z.boolean() }),
            execute: async ({ enabled }) => {
              ensureNotAborted();
              const nextWorkflow = setWorkflowEnabled(workflow, enabled);
              applyWorkflow(
                nextWorkflow,
                `Set workflow enabled to ${enabled}.`,
              );
              return { enabled };
            },
          }),
          getNodeSchema: tool({
            description:
              "Inspect a node type's config fields AND its output structure. Use this when you need to know what properties are available in a node's output for variable referencing.",
            inputSchema: z.object({
              type: z.string().min(1),
            }),
            execute: async ({ type }) => {
              ensureNotAborted();
              const kind = inferNodeType(type, {});
              const definition = getNodeDefinition(kind, type);
              const schema = getNodeSchema(kind, type);

              if (!schema || !definition) {
                throw new Error(`Node schema not found for '${type}'`);
              }

              const outputShape =
                definition.outputExample != null
                  ? `Output example: ${JSON.stringify(definition.outputExample, null, 2)}`
                  : "Output example: (none)";

              persist(
                [
                  `Config fields for ${kind} '${type}':`,
                  ...Object.entries(schema.properties).map(
                    ([name, field]) =>
                      `  ${name} (${field.type}${field.required ? ", required" : ""})`,
                  ),
                  "",
                  outputShape,
                ].join("\n"),
                "tool",
              );

              return { configSchema: schema, outputExample: definition.outputExample };
            },
          }),
          getLatestExecution: tool({
            description:
              "Check the latest workflow execution. Returns nodeResults (per-node status, data, errors) so you can see which nodes failed and why. Use this to answer questions like 'why didn't it work', 'check the execution', 'what went wrong', 'did it run successfully'. Do NOT skip this and jump to getNodeSchema.",
            inputSchema: z.object({}),
            execute: async () => {
              ensureNotAborted();
              const workflowId = workingSession.workflowId;
              if (!workflowId) {
                return { execution: null };
              }

              return { execution: getLatestExecution(workflowId) };
            },
          }),
          ...buildWorkflowNodeTools({
            getWorkflow: () => workflow,
            createNode: (args) => createNode(workflow, args),
            commitWorkflow: (nextWorkflow, message) => {
              ensureNotAborted();
              workflow = nextWorkflow;
              persist(message, "tool");
              workingSession = {
                ...workingSession,
              };
              commitSession(workflow, workingSession);
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
              ensureNotAborted();
              const { workflow: nextWorkflow, result: message } =
                updateNodeConfig(workflow, args);
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
              ensureNotAborted();
              const { workflow: nextWorkflow, result: message } = moveNode(
                workflow,
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
              ensureNotAborted();
              const { workflow: nextWorkflow, result: message } = deleteNode(
                workflow,
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
              ensureNotAborted();
              const { workflow: nextWorkflow, result: message } = connectNodes(
                workflow,
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
              ensureNotAborted();
              const { workflow: nextWorkflow, result: message } =
                disconnectNodes(workflow, args);
              applyWorkflow(nextWorkflow, message);
              return { message };
            },
          }),
        },
      });

      ensureNotAborted();
      const finalText = result.text.trim() || "Workflow updated.";
      workingSession = appendMessage(
        workingSession,
        "assistant",
        finalText,
        "result",
      );

      workflow = finalizeGeneratedWorkflow(workflow, prompt);
      workingSession = {
        ...workingSession,
      };

      workingSession = commitSession(workflow, workingSession);

      return { session: workingSession };
    } catch (error) {
      if (controller.signal.aborted) {
        workingSession = {
          ...stripPendingThinkingMessage(workingSession),
          status: "idle",
          updatedAt: Date.now(),
        };
        workingSession = commitSession(workflow, workingSession);
        return { session: workingSession };
      }

      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate workflow.";

      workingSession = appendMessage(
        workingSession,
        "assistant",
        errorMessage,
        "error",
      );
      workingSession = { ...workingSession, status: "failed" };
      workingSession = commitSession(workflow, workingSession);

      return { session: workingSession };
    } finally {
      this.abortController = null;
    }
  }
}
