import { tool } from "ai";
import z from "zod";
import { getLayoutedElements } from "@/config/designer/ReactFlowCanvasCallbacks";
import {
  connectNodes,
  createNode,
  deleteNode,
  disconnectNodes,
  getLatestExecution,
  inferNodeType,
  setUrlPattern as applyUrlPattern,
  setWorkflowDescription as applyWorkflowDescription,
  setWorkflowEnabled as applyWorkflowEnabled,
  setWorkflowName as applyWorkflowName,
  updateNodeConfig,
  validateWorkflow,
} from "./workflowTools";
import { getNodeDefinition } from "../nodeCatalog";
import { getNodeSchema } from "./node-tools";
import { newActionId, newTriggerId } from "@/utils/helpers";
import { WorkflowDefinition } from "@/types/workflow";
import { selectElementInTab } from "@/services/elementSelectionService";
import { MessageType } from "@/types/messages";

type createToolsParams = {
  workflowId: string;
  popup?: boolean;
  getWorkflowState: () => WorkflowDefinition;
  saveWorkflowState: (workflow: WorkflowDefinition) => void;
};

export function createTools({
  workflowId,
  popup = true,
  getWorkflowState,
  saveWorkflowState,
}: createToolsParams) {
  const buildToolResult = (
    message: string,
    details?: Record<string, unknown>,
  ) => ({
    ok: true,
    message,
    ...details,
  });

  const applyWorkflowChange = (
    mutate: (workflow: WorkflowDefinition) => WorkflowDefinition,
  ) => {
    const workflow = mutate(getWorkflowState());
    saveWorkflowState(workflow);
    return workflow;
  };

  const runWorkflowTool = <TArgs extends Record<string, unknown>>(
    mutate: (
      workflow: WorkflowDefinition,
      args: TArgs,
    ) => {
      workflow: WorkflowDefinition;
      result: string;
    },
  ) => {
    return async (args: TArgs) => {
      const { workflow, result } = mutate(getWorkflowState(), args);
      saveWorkflowState(workflow);
      return { message: result };
    };
  };

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
    promptUserToSelectElement: tool({
      description:
        "Prompt the user to pick an element on the active page with the element inspector. Use this when the requested page target is ambiguous or the user wants to point at a specific element.",
      inputSchema: z.object({
        instruction: z
          .string()
          .min(1)
          .max(160)
          .optional()
          .describe(
            "Short instruction shown in the page overlay, for example 'Select where the button should be injected.'",
          ),
      }),
      execute: async ({ instruction }) => {
        if (!popup) {
          throw new Error(
            "promptUserToSelectElement tool can only be used in popup context",
          );
        }

        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab?.id) {
          throw new Error("No active tab available for element selection");
        }

        // Close the popup so the user can interact with the page
        await chrome.runtime.sendMessage({
          type: MessageType.CLOSE_POPUP,
        }).catch(() => {});

        // Small delay to let the popup close before starting selection
        await new Promise((resolve) => setTimeout(resolve, 200));

        const response = await selectElementInTab(tab.id, {
          source: "ai-chat",
          silent: true,
          instruction,
        });

        // Restore the popup after selection completes
        try {
          await chrome.action.openPopup();
        } catch {
          // openPopup may not be supported in all browsers; silently ignore
        }

        if (!response.ok) {
          throw new Error(response.error || "Failed to select element");
        }

        if (response.canceled || !response.data) {
          return {
            canceled: true,
          };
        }

        return {
          canceled: false,
          selector: response.data.selector,
          tagName: response.data.element.tagName,
          id: response.data.element.id,
          className: response.data.element.className,
          textContent: response.data.element.textContent,
        };
      },
    }),
    setWorkflowName: tool({
      description: "Set the workflow name.",
      inputSchema: z.object({ name: z.string().min(1) }),
      execute: async ({ name }) => {
        applyWorkflowChange((workflow) => applyWorkflowName(workflow, name));
        return buildToolResult(`Set workflow name to '${name}'.`, {
          workflowField: "name",
          value: name,
        });
      },
    }),
    setWorkflowDescription: tool({
      description: "Set the workflow description.",
      inputSchema: z.object({ description: z.string() }),
      execute: async ({ description }) => {
        applyWorkflowChange((workflow) =>
          applyWorkflowDescription(workflow, description),
        );
        return buildToolResult("Updated workflow description.", {
          workflowField: "description",
          value: description,
        });
      },
    }),
    setUrlPattern: tool({
      description: "Set the workflow URL pattern.",
      inputSchema: z.object({ urlPattern: z.string().min(1) }),
      execute: async ({ urlPattern }) => {
        applyWorkflowChange((workflow) =>
          applyUrlPattern(workflow, urlPattern),
        );
        return buildToolResult(`Set URL pattern to '${urlPattern}'.`, {
          workflowField: "urlPattern",
          value: urlPattern,
        });
      },
    }),
    setWorkflowEnabled: tool({
      description:
        "Enable or disable the workflow. Use this sparingly: only when finishing a new workflow, when the user explicitly asks to change enabled state, or when you intentionally disabled it earlier and now need to restore it.",
      inputSchema: z.object({ enabled: z.boolean() }),
      execute: async ({ enabled }) => {
        applyWorkflowChange((workflow) =>
          applyWorkflowEnabled(workflow, enabled),
        );
        return buildToolResult(
          enabled ? "Enabled workflow." : "Disabled workflow.",
          {
            workflowField: "enabled",
            value: enabled,
          },
        );
      },
    }),
    autoArrangeNodes: tool({
      description:
        "Automatically arrange workflow nodes using the same layout as the designer auto-arrange action.",
      inputSchema: z.object({}),
      execute: async () => {
        const before = getWorkflowState();
        applyWorkflowChange((workflow) => {
          const { nodes } = getLayoutedElements(
            workflow.nodes,
            workflow.connections,
          );
          return {
            ...workflow,
            nodes,
            modifiedAt: Date.now(),
          };
        });
        return buildToolResult("Auto-arranged workflow nodes.", {
          nodeCount: before.nodes.length,
          connectionCount: before.connections.length,
        });
      },
    }),
    getNodeSchema: tool({
      description:
        "Required before using Liquid variables. Inspect a node type's config fields and exact output structure so you know which output properties are valid for references like {{action-id.property}}. Never guess property names.",
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
        return { workflow: getWorkflowState() };
      },
    }),
    validateWorkflow: tool({
      description:
        "Validate the current workflow. Checks Liquid variable references, required config fields, missing triggers, and disconnected or unreachable nodes. Always call this after building or modifying a workflow, and make it the final workflow step before setWorkflowEnabled or replying that the workflow is done.",
      inputSchema: z.object({}),
      execute: async () => {
        return validateWorkflow(getWorkflowState());
      },
    }),
    createNode: tool({
      description:
        "Create a new node in the workflow. Use nodeType for the concrete node name such as 'page-load' or 'write-clipboard'. Use nodeKind for the category and set it to either 'trigger' or 'action'.",
      inputSchema: z.object({
        nodeType: z.string().min(1),
        nodeKind: z.enum(["trigger", "action"]),
        position: z.object({ x: z.number(), y: z.number() }),
        config: z.record(z.string(), z.any()).optional(),
        inputs: z.array(z.string()).optional(),
        outputs: z.array(z.string()).optional(),
      }),
      execute: runWorkflowTool((workflow, args) =>
        createNode(workflow, {
          type: args.nodeType,
          nodeType: args.nodeKind,
          position: args.position,
          config: args.config,
          inputs: args.inputs,
          outputs: args.outputs,
          id: args.nodeKind === "trigger" ? newTriggerId() : newActionId(),
        }),
      ),
    }),
    updateNodeConfig: tool({
      description:
        "Update an existing node config. Always include the node id plus either a full config object or a patch object.",
      inputSchema: z.object({
        id: z.string().optional(),
        config: z.record(z.string(), z.any()).optional(),
        patch: z.record(z.string(), z.any()).optional(),
      }),
      execute: runWorkflowTool(updateNodeConfig),
    }),
    deleteNode: tool({
      description: "Delete a node and its connections as consequence.",
      inputSchema: z.object({
        id: z.string().optional(),
      }),
      execute: runWorkflowTool(deleteNode),
    }),
    connectNodes: tool({
      description: "Connect two nodes in the workflow.",
      inputSchema: z.object({
        sourceId: z.string().optional(),
        targetId: z.string().optional(),
      }),
      execute: runWorkflowTool(connectNodes),
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
      execute: runWorkflowTool(disconnectNodes),
    }),
  };
}
