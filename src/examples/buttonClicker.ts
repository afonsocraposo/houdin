import { WorkflowDefinition } from "@/types/workflow";
import { newActionId, newConnectionId, newTriggerId } from "@/utils/helpers";

const triggerId = newTriggerId();
const waitActionId = newActionId();
const clickActionId = newActionId();
const conn1Id = newConnectionId();
const conn2Id = newConnectionId();

export const buttonClicker: WorkflowDefinition = {
  id: "example-button-clicker",
  name: "Smart Button Clicker",
  description: "Wait for a button to appear then click it",
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
      id: waitActionId,
      type: "action",
      position: { x: 500, y: 100 },
      data: {
        type: "wait",
        config: {
          duration: 2,
        },
      },
      inputs: ["input"],
      outputs: ["output"],
    },
    {
      id: clickActionId,
      type: "action",
      position: { x: 800, y: 100 },
      data: {
        type: "click-element",
        config: {
          selectorType: "css",
          elementSelector: "button.accept, button.continue, .btn-primary",
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
      target: waitActionId,
      targetHandle: "input",
    },
    {
      id: conn2Id,
      source: waitActionId,
      sourceHandle: "output",
      target: clickActionId,
      targetHandle: "input",
    },
  ],
  modifiedAt: 0,
};
