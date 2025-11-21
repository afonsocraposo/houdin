import { WorkflowDefinition } from "@/types/workflow";

export const apiTriggerYoutube: WorkflowDefinition = {
  connections: [
    {
      id: "conn-BfHuOg",
      source: "trigger-Ul2GI0",
      sourceHandle: "output",
      target: "action-oty3q7",
      targetHandle: "input",
    },
  ],
  description:
    "Use the HTTP Request trigger to notify every time an API request is Youtube",
  enabled: true,
  id: "workflow-w2XiPXIYD76O",
  modifiedAt: 1759442690345,
  name: "Detect HTTP Requests",
  nodes: [
    {
      data: {
        config: {
          method: "POST",
          urlPattern: "https://www.youtube.com/api/stats/*",
        },
        type: "http-request",
      },
      id: "trigger-Ul2GI0",
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
          notificationContent: "",
          notificationTitle: "💡 Request to Plausible detected",
        },
        type: "show-notification",
      },
      id: "action-oty3q7",
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
};
