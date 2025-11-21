export const DEMO_NAVIGATE_URL_WORKFLOW = {
  connections: [
    {
      id: "conn-Jgj25C",
      source: "trigger-ZQd3c8",
      sourceHandle: "output",
      target: "action-0eGfqI",
      targetHandle: "input",
    },
    {
      id: "conn-v3ZcOv",
      source: "action-0eGfqI",
      sourceHandle: "output",
      target: "action-UNyye5",
      targetHandle: "input",
    },
  ],
  description: "",
  enabled: true,
  id: "workflow-tk2LATvt1GsV",
  modifiedAt: 1760993282738,
  name: "Test navigate URL",
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
          url: "https://example.org",
        },
        type: "navigate-url",
      },
      id: "action-0eGfqI",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 600,
        y: 100,
      },
      type: "action",
    },
    {
      data: {
        config: {
          notificationContent: "Hello world",
          notificationTitle: "Test notification",
        },
        type: "show-notification",
      },
      id: "action-UNyye5",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 900,
        y: 100,
      },
      type: "action",
    },
  ],
  urlPattern: "https://*",
  variables: {},
};
