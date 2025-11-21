export const DEMO_INJECT_COMPONENT_WORKFLOW = {
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
      id: "action-YuT2lG",
      type: "action",
      position: {
        x: 300,
        y: 0,
      },
      data: {
        type: "inject-component",
        config: {
          selectorType: "css",
          targetSelector: "body",
          componentType: "text",
          componentText: "Hello world",
          textColor: "#000000",
          useMarkdown: false,
        },
      },
      inputs: ["input"],
      outputs: ["output"],
    },
  ],
  connections: [
    {
      id: "conn-Pfaga5",
      source: "trigger-ZQd3c8",
      target: "action-YuT2lG",
      sourceHandle: "output",
      targetHandle: "input",
    },
  ],
  modifiedAt: 1760994025259,
  name: "Test inject component",
  description: "",
  urlPattern: "https://*",
  enabled: true,
  variables: {},
};
