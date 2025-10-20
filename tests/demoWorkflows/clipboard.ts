export const DEMO_CLIPBOARD_WORKFLOW = {
  id: "workflow-tk2LATvt1GsV",
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
      id: "action-a50erk",
      type: "action",
      position: {
        x: 600,
        y: 100,
      },
      data: {
        type: "write-clipboard",
        config: {
          text: "Hello world",
        },
      },
      inputs: ["input"],
      outputs: ["output"],
    },
  ],
  connections: [
    {
      id: "conn-RR7LNM",
      source: "trigger-ZQd3c8",
      target: "action-a50erk",
      sourceHandle: "output",
      targetHandle: "input",
    },
  ],
  lastUpdated: 1760993413442,
  name: "Test clipboard write",
  description: "",
  urlPattern: "https://*",
  enabled: true,
  variables: {},
};
