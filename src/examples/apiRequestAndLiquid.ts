import { WorkflowDefinition } from "@/types/workflow";

export const apiRequestAndLiquid: WorkflowDefinition = {
  connections: [
    {
      id: "conn-tXGM23",
      source: "trigger-wxMING",
      sourceHandle: "output",
      target: "action-rUTxQh",
      targetHandle: "input",
    },
    {
      id: "conn-GDPSYf",
      source: "action-rUTxQh",
      sourceHandle: "output",
      target: "action-8NBs0T",
      targetHandle: "input",
    },
  ],
  description: "Example workflow showcasing HTTP request and liquid syntax",
  enabled: true,
  id: "workflow-aq9pm4eiW5SS",
  modifiedAt: 1761167088942,
  name: "Parse API response with Liquid syntax",
  nodes: [
    {
      data: {
        config: {
          buttonColor: "#228be6",
          buttonTextColor: "#ffffff",
          componentText: "🐱",
          componentType: "fab",
          selectorType: "css",
          targetSelector: "body",
        },
        type: "button-click",
      },
      id: "trigger-wxMING",
      inputs: [],
      outputs: ["output"],
      position: {
        x: 277,
        y: 107,
      },
      type: "trigger",
    },
    {
      data: {
        config: {
          url: "https://meowfacts.herokuapp.com/?count=3",
        },
        type: "http-request",
      },
      id: "action-rUTxQh",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 612,
        y: 104,
      },
      type: "action",
    },
    {
      data: {
        config: {
          modalContent:
            "## Did you know that:\n\n{% for fact in action-rUTxQh.data.data %}\n  {{ fact }}\n{% endfor %}\n\n*Meow!*",
          modalTitle: "Cat facts",
        },
        type: "show-modal",
      },
      id: "action-8NBs0T",
      inputs: ["input"],
      outputs: ["output"],
      position: {
        x: 912,
        y: 105.5,
      },
      type: "action",
    },
  ],
  urlPattern: "https://*",
  variables: {},
};
