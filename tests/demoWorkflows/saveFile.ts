export const DEMO_SAVE_FILE_WORKFLOW = {
  connections: [
    {
      id: "conn-save-file",
      source: "trigger-save-file",
      sourceHandle: "output",
      target: "action-save-file",
      targetHandle: "input",
    },
  ],
  description: "",
  enabled: true,
  id: "workflow-save-file-demo",
  modifiedAt: 1760992353944,
  name: "Test save file",
  nodes: [
    {
      data: {
        config: {},
        type: "page-load",
      },
      id: "trigger-save-file",
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
          content: "Hello world",
          filename: "hello-world.txt",
          mimeType: "text/plain",
        },
        type: "save-file",
      },
      id: "action-save-file",
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
