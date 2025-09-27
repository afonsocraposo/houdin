import { WorkflowDefinition } from "@/types/workflow";

export const askChatGPT: WorkflowDefinition = {
  id: "workflow-RIcDSFXihngG",
  connections: [
    {
      id: "conn-0RcEsw",
      source: "trigger-q8k6LD",
      sourceHandle: "output",
      target: "action-hqxdDh",
      targetHandle: "input",
    },
    {
      id: "conn-TPoOv4",
      source: "action-hqxdDh",
      sourceHandle: "output",
      target: "action-m3RAH3",
      targetHandle: "input",
    },
    {
      id: "conn-pL9O4K",
      source: "action-m3RAH3",
      sourceHandle: "output",
      target: "action-XhsIsm",
      targetHandle: "input",
    },
    {
      id: "conn-KXtchY",
      source: "action-XhsIsm",
      sourceHandle: "output",
      target: "action-vNquje",
      targetHandle: "input",
    },
  ],
  description:
    "Press CTRL+H on any webpage and ask anything about it to ChatGPT. It requires an OpenAI API key.",
  enabled: true,
  lastUpdated: 1758990841893,
  name: "Ask ChatGPT",
  nodes: [
    {
      data: {
        config: {
          fields: [
            {
              label: "Prompt",
              name: "prompt",
              placeholder: "Ask something",
              required: true,
              type: "text",
            },
            {
              defaultValue: "gpt-5",
              label: "Model",
              name: "model",
              options: ["gpt-5", "gpt-4o-mini", "gpt-4o"],
              required: false,
              type: "select",
            },
          ],
          title: "Ask ChatGPT",
        },
        type: "form",
      },
      id: "action-m3RAH3",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 600,
        y: 0,
      },
      type: "action",
    },
    {
      data: {
        config: {
          credentialId: "",
          customModel: "{{action-m3RAH3.model}}",
          model: "custom",
          prompt:
            "{{action-m3RAH3.prompt}}\nPage Context:\n{{action-hqxdDh.content}}",
        },
        type: "llm-openai",
      },
      id: "action-XhsIsm",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 900,
        y: 0,
      },
      type: "action",
    },
    {
      data: {
        config: {
          selector: "body",
        },
        type: "get-element-content",
      },
      id: "action-hqxdDh",
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
          keyCombo: "Ctrl + H",
        },
        type: "key-press",
      },
      id: "trigger-q8k6LD",
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
          modalContent: "{{action-XhsIsm.response}}",
          modalTitle: "ChatGPT says...",
        },
        type: "show-modal",
      },
      id: "action-vNquje",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 1200,
        y: 0,
      },
      type: "action",
    },
  ],
  urlPattern: "https://*",
};
