export const DEMO_CUSTOM_SCRIPT_WORKFLOW = {
  connections: [
    {
      id: "conn-XPrk4i",
      source: "trigger-ZQd3c8",
      sourceHandle: "output",
      target: "action-w3DENc",
      targetHandle: "input",
    },
  ],
  description: "",
  enabled: true,
  id: "workflow-dX2oK6UEhKnr",
  lastUpdated: 1760984247415,
  name: "Test custom script",
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
          customScript:
            'document.body.innerHTML += \`<div id="test-custom-script">Hello world</div>\`',
        },
        type: "custom-script",
      },
      id: "action-w3DENc",
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
