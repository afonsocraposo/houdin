export const DEMO_HTTP_REQUEST_WORKFLOW = {
  connections: [
    {
      id: "conn-GOumTR",
      source: "trigger-ZQd3c8",
      sourceHandle: "output",
      target: "action-dEBPsQ",
      targetHandle: "input",
    },
    {
      id: "conn-jvcLX2",
      source: "action-dEBPsQ",
      sourceHandle: "output",
      target: "action-PB7rNg",
      targetHandle: "input",
    },
  ],
  description: "",
  enabled: true,
  id: "workflow-tk2LATvt1GsV",
  modifiedAt: 1760994279475,
  name: "Test HTTP request",
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
        x: 0,
        y: 0,
      },
      type: "trigger",
    },
    {
      data: {
        config: {
          url: "https://api.ipify.org/",
        },
        type: "http-request",
      },
      id: "action-dEBPsQ",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 300,
        y: 0,
      },
      type: "action",
    },
    {
      data: {
        config: {
          modalContent: "{{action-dEBPsQ.data}}",
          modalTitle: "Public IP",
        },
        type: "show-modal",
      },
      id: "action-PB7rNg",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 600,
        y: 0,
      },
      type: "action",
    },
  ],
  urlPattern: "https://*",
  variables: {},
};
