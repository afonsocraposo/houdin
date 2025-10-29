export const DEMO_CREATE_VARIABLE_WORKFLOW = {
  connections: [
    {
      id: "conn-1",
      source: "trigger-1",
      sourceHandle: "output",
      target: "action-1",
      targetHandle: "input",
    },
    {
      id: "conn-2",
      source: "action-1",
      sourceHandle: "output",
      target: "action-2",
      targetHandle: "input",
    },
  ],
  description: "Demo workflow for create variable action",
  enabled: true,
  id: "workflow-create-variable-demo",
  lastUpdated: Date.now(),
  name: "Demo Create Variable",
  nodes: [
    {
      data: {
        config: {},
        type: "component-load",
      },
      id: "trigger-1",
      inputs: [],
      outputs: ["output"],
      position: {
        x: 100,
        y: 100,
      },
      type: "trigger",
    },
    {
      data: {
        config: {
          variableName: "greeting",
          variableValue: "Hello World from Variable Action!"
        },
        type: "create-variable",
      },
      id: "action-1",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 300,
        y: 100,
      },
      type: "action",
    },
    {
      data: {
        config: {
          notificationTitle: "Variable Test",
          notificationContent: "{{action-1.greeting}}",
        },
        type: "show-notification",
      },
      id: "action-2",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 500,
        y: 100,
      },
      type: "action",
    },
  ],
  urlPattern: "https://*",
  variables: {},
};