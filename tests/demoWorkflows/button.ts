export const DEMO_BUTTON_WORKFLOW = {
  id: "workflow-tk2LATvt1GsV",
  nodes: [
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
    {
      id: "trigger-cPOGo5",
      type: "trigger",
      position: {
        x: 0,
        y: 0,
      },
      data: {
        type: "button-click",
        config: {
          componentType: "button",
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
  ],
  connections: [
    {
      id: "conn-7E6PDf",
      source: "trigger-cPOGo5",
      target: "action-hSdaGz",
      sourceHandle: "output",
      targetHandle: "input",
    },
  ],
  modifiedAt: 1760996649788,
  name: "Test FAB",
  description: "",
  urlPattern: "https://*",
  enabled: true,
  variables: {},
};
