export const DEMO_META_VARIABLES_WORKFLOW = {
  connections: [
    {
      id: "conn-GqJwsY",
      source: "trigger-ZQd3c8",
      sourceHandle: "output",
      target: "action-hy33RB",
      targetHandle: "input",
    },
  ],
  description: "",
  enabled: true,
  id: "workflow-tk2LATvt1GsV",
  modifiedAt: 1760994837561,
  name: "Test meta variables",
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
          modalContent: "{{meta.url}}",
          modalTitle: "meta.url",
        },
        type: "show-modal",
      },
      id: "action-hy33RB",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 300,
        y: 0,
      },
      type: "action",
    },
  ],
  urlPattern: "https://*",
  variables: {},
};
