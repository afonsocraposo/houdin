import { WorkflowDefinition } from "@/types/workflow";

export const apiRequestIP: WorkflowDefinition = {
  connections: [
    {
      id: "conn-HlP1wD",
      source: "trigger-Nocdk7",
      sourceHandle: "output",
      target: "action-Hi5qne",
      targetHandle: "input",
    },
    {
      id: "conn-QgA5iL",
      source: "action-Hi5qne",
      sourceHandle: "output",
      target: "action-aBmfbg",
      targetHandle: "input",
    },
  ],
  description: "Use ipify public IP to figure out current public IP.",
  enabled: true,
  id: "workflow-gapi8s9c2ukY",
  modifiedAt: 1759441266664,
  name: "API Request IP",
  nodes: [
    {
      data: {
        config: {
          buttonColor: "#868e96",
          buttonTextColor: "#ffffff",
          componentText: "🌍",
          componentType: "fab",
          selectorType: "css",
          targetSelector: "body",
        },
        type: "button-click",
      },
      id: "trigger-Nocdk7",
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
          url: "https://api.ipify.org?format=json",
        },
        type: "http-request",
      },
      id: "action-Hi5qne",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 300,
        y: 0,
      },
      type: "action",
    },
    {
      data: {
        config: {
          modalContent: "{{action-Hi5qne.data.ip}}",
          modalTitle: "My Public IP is...",
        },
        type: "show-modal",
      },
      id: "action-aBmfbg",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 600,
        y: 0,
      },
      type: "action",
    },
  ],
  urlPattern: "https://*",
};
