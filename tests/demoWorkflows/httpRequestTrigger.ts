export const DEMO_HTTP_REQUEST_TRIGGER_WORKFLOW = {
  id: "workflow-tk2LATvt1GsV",
  nodes: [
    {
      data: {
        config: {
          method: "GET",
          urlPattern: "https://api.ipify.org",
        },
        type: "http-request",
      },
      id: "trigger-x51I5j",
      inputs: [],
      outputs: ["output"],
      position: {
        x: 329,
        y: -27,
      },
      type: "trigger",
    },
    {
      data: {
        config: {
          notificationTitle: "Request detected",
        },
        type: "show-notification",
      },
      id: "action-hSdaGz",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 629,
        y: -27,
      },
      type: "action",
    },
  ],
  connections: [
    {
      id: "conn-Zc1v6c",
      source: "trigger-x51I5j",
      sourceHandle: "output",
      target: "action-hSdaGz",
      targetHandle: "input",
    },
  ],
  modifiedAt: 1760995407724,
  name: "Test http request trigger",
  description: "",
  urlPattern: "https://*",
  enabled: true,
  variables: {},
};
