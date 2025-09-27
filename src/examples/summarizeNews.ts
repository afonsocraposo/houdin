import { WorkflowDefinition } from "@/types/workflow";

export const summarizeNews: WorkflowDefinition = {
  connections: [
    {
      id: "conn-Hd2cD3",
      source: "trigger-vwidyP",
      sourceHandle: "output",
      target: "action-wARdUQ",
      targetHandle: "input",
    },
    {
      id: "conn-EjQFtu",
      source: "trigger-6CrmZl",
      sourceHandle: "output",
      target: "action-qjORtw",
      targetHandle: "input",
    },
    {
      id: "conn-WXNqri",
      source: "action-qjORtw",
      sourceHandle: "output",
      target: "action-Tc6M6H",
      targetHandle: "input",
    },
    {
      id: "conn-wzAe5A",
      source: "action-Tc6M6H",
      sourceHandle: "output",
      target: "action-xAspFI",
      targetHandle: "input",
    },
  ],
  description:
    "Uses OpenAI to summarize CNN's news article and injects the summary at the top of the page",
  enabled: true,
  id: "workflow-Wdf7eudQPW0r",
  lastUpdated: 1758988717106,
  name: "Summarize news article",
  nodes: [
    {
      data: {
        config: {},
        type: "page-load",
      },
      id: "trigger-6CrmZl",
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
          selector: ".article__content",
        },
        type: "get-element-content",
      },
      id: "action-qjORtw",
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
          credentialId: "",
          prompt: "Summarize this news article:\n{{action-qjORtw}}",
        },
        type: "llm-openai",
      },
      id: "action-Tc6M6H",
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
          componentHtml: "<b>Hello</b>, <i>world</i>!",
          componentText: "{{action-Tc6M6H.response}}",
          componentType: "text",
          selectorType: "css",
          targetSelector: ".headline__wrapper",
          textColor: "#000000",
          useMarkdown: true,
        },
        type: "inject-component",
      },
      id: "action-xAspFI",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 900,
        y: 0,
      },
      type: "action",
    },
  ],
  urlPattern: "https://edition.cnn.com/*",
};
