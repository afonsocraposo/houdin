import { WorkflowDefinition } from "@/types/workflow";
import { newActionId, newConnectionId, newTriggerId } from "@/utils/helpers";

const triggerId = newTriggerId();
const getContentActionId = newActionId();
const notifyActionId = newActionId();
const conn1Id = newConnectionId();
const conn2Id = newConnectionId();

export const contentExtractor: WorkflowDefinition = {
  id: "example-content-extractor",
  name: "Content Extractor",
  description: "Extract text from an element and show it in a modal",
  urlPattern: "https://*",
  enabled: true,
  nodes: [
    {
      id: triggerId,
      type: "trigger",
      position: { x: 200, y: 100 },
      data: {
        type: "page-load",
        config: {},
      },
      inputs: [],
      outputs: ["output"],
    },
    {
      id: getContentActionId,
      type: "action",
      position: { x: 500, y: 100 },
      data: {
        type: "get-element-content",
        config: {
          elementSelector: "h1",
          selectorType: "css",
        },
      },
      inputs: ["input"],
      outputs: ["output"],
    },
    {
      id: notifyActionId,
      type: "action",
      position: { x: 800, y: 100 },
      data: {
        type: "show-modal",
        config: {
          modalContent: `Extracted Content:\n{{${getContentActionId}}}`,
        },
      },
      inputs: ["input"],
      outputs: ["output"],
    },
  ],
  connections: [
    {
      id: conn1Id,
      source: triggerId,
      sourceHandle: "output",
      target: getContentActionId,
      targetHandle: "input",
    },
    {
      id: conn2Id,
      source: getContentActionId,
      sourceHandle: "output",
      target: notifyActionId,
      targetHandle: "input",
    },
  ],
  modifiedAt: 0,
};
