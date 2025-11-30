import { WorkflowDefinition } from "@/types/workflow";
import { generateId } from "@/utils/helpers";

const triggerId = generateId("trigger");
const actionId = generateId("action");
const connId = generateId("conn");

export const welcomeMessage: WorkflowDefinition = {
  id: "example-welcome-message",
  name: "Welcome Message",
  description: "Show a welcome modal when the page loads",
  urlPattern: "https://*",
  enabled: true,
  nodes: [
    {
      id: triggerId,
      type: "trigger",
      position: { x: 300, y: 100 },
      data: {
        type: "page-load",
        config: {},
      },
      inputs: [],
      outputs: ["output"],
    },
    {
      id: actionId,
      type: "action",
      position: { x: 600, y: 100 },
      data: {
        type: "show-modal",
        config: {
          modalContent: "Welcome! This workflow was created from an example.",
        },
      },
      inputs: ["input"],
      outputs: ["output"],
    },
  ],
  connections: [
    {
      id: connId,
      source: triggerId,
      sourceHandle: "output",
      target: actionId,
      targetHandle: "input",
    },
  ],
  modifiedAt: 0,
};
