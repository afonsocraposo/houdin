import { WorkflowDefinition } from "@/types/workflow";
import { generateId } from "@/utils/helpers";

const triggerId = generateId("trigger");
const getContentActionId = generateId("action");
const notifyActionId = generateId("action");
const conn1Id = generateId("conn");
const conn2Id = generateId("conn");

export const contentExtractor: WorkflowDefinition = {
  id: "example-content-extractor",
  name: "Content Extractor",
  description: "Extract text from an element and show it in a notification",
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
          contentType: "text",
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
        type: "show-notification",
        config: {
          message: "Page title: {{get-element-content.output}}",
          type: "info",
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
};
