export const DEMO_COOKIE_WORKFLOW = {
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
        x: 0,
        y: 0,
      },
      type: "trigger",
    },
    {
      id: "action-ZPkgTU",
      type: "action",
      position: {
        x: 321,
        y: -1,
      },
      data: {
        type: "cookies",
        config: {
          operation: "create",
          key: "foo",
          value: "bar",
        },
      },
      inputs: ["input"],
      outputs: ["output"],
    },
    {
      id: "action-ZAkZ15",
      type: "action",
      position: {
        x: 600,
        y: 0,
      },
      data: {
        type: "cookies",
        config: {
          operation: "read",
          key: "foo",
          value: "bar",
        },
      },
      inputs: ["input"],
      outputs: ["output"],
    },
    {
      id: "action-RIbQEg",
      type: "action",
      position: {
        x: 900,
        y: -0.3333333333333333,
      },
      data: {
        type: "show-modal",
        config: {
          modalContent: "value: {{action-ZAkZ15.value.value}}",
          modalTitle: "Cookie",
        },
      },
      inputs: ["input"],
      outputs: ["output"],
    },
  ],
  connections: [
    {
      id: "conn-qHUSkY",
      source: "trigger-ZQd3c8",
      target: "action-ZPkgTU",
      sourceHandle: "output",
      targetHandle: "input",
    },
    {
      id: "conn-aCyN3W",
      source: "action-ZPkgTU",
      target: "action-ZAkZ15",
      sourceHandle: "output",
      targetHandle: "input",
    },
    {
      id: "conn-fpMkGl",
      source: "action-ZAkZ15",
      target: "action-RIbQEg",
      sourceHandle: "output",
      targetHandle: "input",
    },
  ],
  modifiedAt: 1760994527313,
  name: "Test cookies",
  description: "",
  urlPattern: "https://*",
  enabled: true,
  variables: {},
};
