export const DEMO_WORKFLOW = {
  connections: [
    {
      id: "conn-mjibxe",
      source: "trigger-5rfUmu",
      sourceHandle: "output",
      target: "action-P8n5PD",
      targetHandle: "input",
    },
  ],
  description: "This is a test workflow",
  enabled: true,
  id: "workflow-mo1MFlsIZKh9",
  lastUpdated: 1758567088230,
  name: "Test Workflow",
  nodes: [
    {
      data: {
        config: {},
        type: "page-load",
      },
      id: "trigger-5rfUmu",
      inputs: [],
      outputs: ["output"],
      position: {
        x: 300,
        y: 100,
      },
      type: "trigger",
    },
    {
      data: {
        config: {
          modalContent: "Hello from Houdin workflow",
        },
        type: "show-modal",
      },
      id: "action-P8n5PD",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 600,
        y: 100,
      },
      type: "action",
    },
  ],
  urlPattern: "https://*",
};

export const DEMO_FAILING_WORKFLOW = {
  connections: [
    {
      id: "conn-mjibxe",
      source: "trigger-5rfUmu",
      sourceHandle: "output",
      target: "action-P8n5PD",
      targetHandle: "input",
    },
  ],
  description: "This is a test workflow",
  enabled: true,
  id: "workflow-mo1MFlsIZKh9",
  lastUpdated: 1758567088230,
  name: "Test Workflow",
  nodes: [
    {
      data: {
        config: {},
        type: "page-load",
      },
      id: "trigger-5rfUmu",
      inputs: [],
      outputs: ["output"],
      position: {
        x: 300,
        y: 100,
      },
      type: "trigger",
    },
    {
      data: {
        config: {
          elementSelector: "#non-existent-element",
        },
        type: "click-element",
      },
      id: "action-P8n5PD",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 600,
        y: 100,
      },
      type: "action",
    },
  ],
  urlPattern: "https://*",
};

export * from "./createVariable";
