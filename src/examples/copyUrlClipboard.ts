import { WorkflowDefinition } from "@/types/workflow";

export const copyUrlClipboard: WorkflowDefinition = {
  connections: [
    {
      id: "conn-4jcwE0",
      source: "trigger-nIiFrD",
      sourceHandle: "output",
      target: "action-yuYRUq",
      targetHandle: "input",
    },
    {
      id: "conn-mgt7HS",
      source: "action-yuYRUq",
      sourceHandle: "output",
      target: "action-eWGxxw",
      targetHandle: "input",
    },
  ],
  description: "",
  enabled: true,
  id: "workflow-DEEvluCY1ZUo",
  lastUpdated: 1759681061210,
  name: "Copy current URL to clipboard",
  nodes: [
    {
      data: {
        config: {
          keyCombo: "Ctrl + C",
        },
        type: "key-press",
      },
      id: "trigger-nIiFrD",
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
          text: "{{meta.url}}",
        },
        type: "write-clipboard",
      },
      id: "action-yuYRUq",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 600,
        y: 100,
      },
      type: "action",
    },
    {
      data: {
        config: {
          notificationContent: "{{action-yuYRUq.text}}",
          notificationTitle: "✅ Copied URL!",
        },
        type: "show-notification",
      },
      id: "action-eWGxxw",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 900,
        y: 100,
      },
      type: "action",
    },
  ],
  urlPattern: "https://*",
};
