export const DEMO_MODAL_WORKFLOW = {
  connections: [
    {
      id: "conn-hJuzQu",
      source: "trigger-ZQd3c8",
      sourceHandle: "output",
      target: "action-Gk8XwQ",
      targetHandle: "input",
    },
  ],
  description: "",
  enabled: true,
  id: "workflow-tk2LATvt1GsV",
  modifiedAt: 1760992632871,
  name: "Test modal",
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
          modalContent: "# Hello world",
          modalTitle: "Test modal",
        },
        type: "show-modal",
      },
      id: "action-Gk8XwQ",
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
