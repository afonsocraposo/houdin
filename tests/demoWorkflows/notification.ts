export const DEMO_NOTIFICATION_WORKFLOW = {
  connections: [
    {
      id: "conn-u1z58L",
      source: "trigger-ZQd3c8",
      sourceHandle: "output",
      target: "action-TF8FVn",
      targetHandle: "input",
    },
  ],
  description: "",
  enabled: true,
  id: "workflow-tk2LATvt1GsV",
  lastUpdated: 1760992353944,
  name: "Test notification",
  nodes: [
    {
      data: {
        config: {},
        type: "page-load",
      },
      id: "trigger-ZQd3c8",
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
          notificationContent: "Hello world",
          notificationTitle: "Test notification",
        },
        type: "show-notification",
      },
      id: "action-TF8FVn",
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
  variables: {},
};
