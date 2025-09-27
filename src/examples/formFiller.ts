import { WorkflowDefinition } from "@/types/workflow";
import { generateId } from "@/utils/helpers";

const triggerId = generateId("trigger");
const fillActionId = generateId("action");
const submitActionId = generateId("action");
const conn1Id = generateId("conn");
const conn2Id = generateId("conn");

export const formFiller: WorkflowDefinition = {
  id: "example-form-filler",
  name: "Auto Form Filler",
  description: "Automatically fill a form field and submit it",
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
      id: fillActionId,
      type: "action",
      position: { x: 500, y: 100 },
      data: {
        type: "input",
        config: {
          elementSelector: "input[name='email']",
          inputValue: "user@example.com",
        },
      },
      inputs: ["input"],
      outputs: ["output"],
    },
    {
      id: submitActionId,
      type: "action",
      position: { x: 800, y: 100 },
      data: {
        type: "click-element",
        config: {
          elementSelector: "button[type='submit']",
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
      target: fillActionId,
      targetHandle: "input",
    },
    {
      id: conn2Id,
      source: fillActionId,
      sourceHandle: "output",
      target: submitActionId,
      targetHandle: "input",
    },
  ],
};
