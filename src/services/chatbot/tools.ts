import { tool } from "ai";
import z from "zod";
import { getWorkflow, saveWorkflow } from "./chat-storage";
import { getLayoutedElements } from "@/config/designer/ReactFlowCanvasCallbacks";
import {
  connectNodes,
  createNode,
  deleteNode,
  disconnectNodes,
  getLatestExecution,
  inferNodeType,
  moveNode,
  updateNodeConfig,
} from "./workflowTools";
import { getNodeDefinition } from "../nodeCatalog";
import { getNodeSchema } from "../workflowGenerationNodeTools";
import { newActionId, newTriggerId } from "@/utils/helpers";

type createToolsParams = {
  workflowId: string;
  popup?: boolean;
};

export function createTools({ workflowId, popup = true }: createToolsParams) {
  return {
    getCurrentTab: tool({
      description: "Get the current active browser tab title and URL.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!popup) {
          throw new Error(
            "getCurrentTab tool can only be used in popup context",
          );
        }
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        return {
          title: tab?.title ?? "",
          url: tab?.url ?? "",
        };
      },
    }),
    getSelectedText: tool({
      description: "Get the currently selected text from the active webpage.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!popup) {
          throw new Error(
            "getSelectedText tool can only be used in popup context",
          );
        }
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab?.id) {
          return { text: "" };
        }

        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.getSelection()?.toString() ?? "",
        });

        return {
          text: result.result ?? "",
        };
      },
    }),
    setWorkflowName: tool({
      description: "Set the workflow name.",
      inputSchema: z.object({ name: z.string().min(1) }),
      execute: async ({ name }) => {
        const workflow = getWorkflow(workflowId);
        workflow.name = name;
        saveWorkflow(workflow);
        return { name };
      },
    }),
    setWorkflowDescription: tool({
      description: "Set the workflow description.",
      inputSchema: z.object({ description: z.string() }),
      execute: async ({ description }) => {
        const workflow = getWorkflow(workflowId);
        workflow.description = description;
        saveWorkflow(workflow);
        return { description };
      },
    }),
    setUrlPattern: tool({
      description: "Set the workflow URL pattern.",
      inputSchema: z.object({ urlPattern: z.string().min(1) }),
      execute: async ({ urlPattern }) => {
        const workflow = getWorkflow(workflowId);
        workflow.urlPattern = urlPattern;
        saveWorkflow(workflow);
        return { urlPattern };
      },
    }),
    setWorkflowEnabled: tool({
      description: "Enable or disable the workflow.",
      inputSchema: z.object({ enabled: z.boolean() }),
      execute: async ({ enabled }) => {
        const workflow = getWorkflow(workflowId);
        workflow.enabled = enabled;
        saveWorkflow(workflow);
        return { enabled };
      },
    }),
    autoArrangeNodes: tool({
      description:
        "Automatically arrange workflow nodes using the same layout as the designer auto-arrange action.",
      inputSchema: z.object({}),
      execute: async () => {
        const workflow = getWorkflow(workflowId);
        const { nodes } = getLayoutedElements(
          workflow.nodes,
          workflow.connections,
        );
        workflow.nodes = nodes;
        saveWorkflow(workflow);
        return {};
      },
    }),
    getNodeSchema: tool({
      description:
        "Inspect a node type's config fields AND its output structure. Use this when you need to know what properties are available in a node's output for variable referencing.",
      inputSchema: z.object({
        type: z.string().min(1),
      }),
      execute: async ({ type }) => {
        const kind = inferNodeType(type, {});
        const definition = getNodeDefinition(kind, type);
        const schema = getNodeSchema(kind, type);

        if (!schema || !definition) {
          throw new Error(`Node schema not found for '${type}'`);
        }

        return {
          configSchema: schema,
          outputExample: definition.outputExample,
        };
      },
    }),
    getLatestExecution: tool({
      description:
        "Check the latest workflow execution. Returns nodeResults (per-node status, data, errors) so you can see which nodes failed and why. Use this to answer questions like 'why didn't it work', 'check the execution', 'what went wrong', 'did it run successfully'. Do NOT skip this and jump to getNodeSchema.",
      inputSchema: z.object({}),
      execute: async () => {
        return { execution: getLatestExecution(workflowId) };
      },
    }),
    getWorkflow: tool({
      description: "Get the current workflow JSON.",
      inputSchema: z.object({}),
      execute: async () => {
        return { workflow: getWorkflow(workflowId) };
      },
    }),
    createNode: tool({
      description: "Create a new node in the workflow.",
      inputSchema: z.object({
        type: z.string().min(1),
        nodeType: z.enum(["trigger", "action"]),
        position: z.object({ x: z.number(), y: z.number() }),
        config: z.record(z.string(), z.any()).optional(),
        inputs: z.array(z.string()).optional(),
        outputs: z.array(z.string()).optional(),
      }),
      execute: async (args) => {
        const { workflow: nextWorkflow, result: message } = createNode(
          getWorkflow(workflowId),
          {
            ...args,
            id: args.type === "trigger" ? newTriggerId() : newActionId(),
          },
        );
        saveWorkflow(nextWorkflow);
        return { message };
      },
    }),
    updateNodeConfig: tool({
      description: "Update an existing node config.",
      inputSchema: z.object({
        id: z.string().optional(),
        config: z.record(z.string(), z.any()).optional(),
        patch: z.record(z.string(), z.any()).optional(),
      }),
      execute: async (args) => {
        const workflow = getWorkflow(workflowId);
        const { workflow: nextWorkflow, result: message } = updateNodeConfig(
          workflow,
          args,
        );
        saveWorkflow(nextWorkflow);
        return { message };
      },
    }),
    moveNode: tool({
      description: "Move an existing node.",
      inputSchema: z.object({
        id: z.string().optional(),
        position: z.object({ x: z.number(), y: z.number() }),
      }),
      execute: async (args) => {
        const workflow = getWorkflow(workflowId);
        const { workflow: nextWorkflow, result: message } = moveNode(
          workflow,
          args,
        );
        saveWorkflow(nextWorkflow);
        return { message };
      },
    }),
    deleteNode: tool({
      description: "Delete a node and its connections as consequence.",
      inputSchema: z.object({
        id: z.string().optional(),
      }),
      execute: async (args) => {
        const workflow = getWorkflow(workflowId);
        const { workflow: nextWorkflow, result: message } = deleteNode(
          workflow,
          args,
        );
        saveWorkflow(nextWorkflow);
        return { message };
      },
    }),
    connectNodes: tool({
      description: "Connect two nodes in the workflow.",
      inputSchema: z.object({
        sourceId: z.string().optional(),
        targetId: z.string().optional(),
      }),
      execute: async (args) => {
        const workflow = getWorkflow(workflowId);
        const { workflow: nextWorkflow, result: message } = connectNodes(
          workflow,
          args,
        );
        saveWorkflow(nextWorkflow);
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
        const workflow = getWorkflow(workflowId);
        const { workflow: nextWorkflow, result: message } = disconnectNodes(
          workflow,
          args,
        );
        saveWorkflow(nextWorkflow);
        return { message };
      },
    }),
  };
}
