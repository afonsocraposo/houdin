export const DEMO_LIQUID_WORKFLOW = {
  connections: [
    {
      id: "conn-Pi8K55",
      source: "trigger-BlztxT",
      sourceHandle: "output",
      target: "action-jtJ0Wy",
      targetHandle: "input",
    },
  ],
  description: "",
  enabled: true,
  id: "workflow-ZwK1HxwgSFB2",
  modifiedAt: 1761167376547,
  name: "Test liquid syntax",
  nodes: [
    {
      data: {
        config: {},
        type: "page-load",
      },
      id: "trigger-BlztxT",
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
          modalTitle: "meta url with liquid",
          modalContent: '{{meta.url | append: "#test"}}',
        },
        type: "show-modal",
      },
      id: "action-jtJ0Wy",
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
