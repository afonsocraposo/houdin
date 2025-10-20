export const DEMO_FAB_WORKFLOW = {
  id: "workflow-tk2LATvt1GsV",
  nodes: [
    {
      id: "trigger-SinwSY",
      type: "trigger",
      position: {
        x: 0,
        y: 0,
      },
      data: {
        type: "button-click",
        config: {
          componentType: "fab",
          selectorType: "css",
          targetSelector: "body",
          componentText: "FB",
          buttonColor: "#228be6",
          buttonTextColor: "#ffffff",
        },
      },
      inputs: [],
      outputs: ["output"],
    },
    {
      data: {
        config: {
          notificationTitle: "Workflow triggered",
        },
        type: "show-notification",
      },
      id: "action-hSdaGz",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 300,
        y: 0,
      },
      type: "action",
    },
  ],
  connections: [
    {
      id: "conn-u6hfWb",
      source: "trigger-SinwSY",
      target: "action-hSdaGz",
      sourceHandle: "output",
      targetHandle: "input",
    },
  ],
  lastUpdated: 1760996037663,
  name: "Test FAB",
  description: "",
  urlPattern: "https://*",
  enabled: true,
  variables: {},
};
