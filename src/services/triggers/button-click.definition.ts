import type { NodeDefinition } from "../node-definitions/types";
import {
  codeProperty,
  colorProperty,
  customProperty,
  selectProperty,
  textProperty,
} from "@/types/config-properties";

const definition = {
  kind: "trigger",
  metadata: {
    type: "button-click",
    label: "Button Click",
    icon: "🔘",
    description:
      "Injects a clickable button into the page (inline or floating) and triggers the workflow when clicked. Handles both injection and click detection.",
  },
  configSchema: {
    properties: {
      // Component preview
      preview: customProperty({
        label: "Component Preview",
        component: "InjectComponentPreview",
      }),
      componentType: selectProperty({
        label: "Button Type",
        options: [
          { value: "button", label: "Button" },
          {
            value: "fab",
            label: "Floating Action Button",
          },
        ],
        defaultValue: "fab",
      }),
      selectorType: selectProperty({
        label: "Selector Type",
        options: [
          { label: "CSS Selector", value: "css" },
          { label: "XPath", value: "xpath" },
        ],
        defaultValue: "css",
        description: "Type of selector to use for component injection",
        showWhen: {
          field: "componentType",
          value: ["button"],
        },
      }),
      targetSelector: textProperty({
        label: "Target Selector",
        placeholder: ".header, #main-content",
        description:
          "Where to inject the component (not needed for floating action button)",
        defaultValue: "body",
        showWhen: {
          field: "componentType",
          value: "button",
        },
      }),
      injectionPosition: selectProperty({
        label: "Position",
        options: [
          { value: "start", label: "Start (prepend)" },
          { value: "end", label: "End (append)" },
        ],
        defaultValue: "end",
        description: "Where to inject the component within the target element",
        showWhen: {
          field: "componentType",
          value: "button",
        },
      }),
      componentText: textProperty({
        label: "Component Text",
        placeholder: "Click me",
        defaultValue: "♥️",
      }),
      // Button-specific properties
      buttonColor: colorProperty({
        label: "Button Color",
        description: "Background color of the button",
        defaultValue: "#228be6",
      }),
      buttonTextColor: colorProperty({
        label: "Button Text Color",
        description: "Text color of the button",
        defaultValue: "#ffffff",
      }),
      // Advanced styling (for all types)
      customStyle: codeProperty({
        label: "Custom CSS (Advanced)",
        placeholder: "margin: 10px; border-radius: 4px;",
        description:
          "Additional CSS properties. For floating action button, use: bottom: 40; right: 40; (in pixels)",
        language: "text",
        height: 100,
      }),
    },
  },
  outputExample: {
    componentType: "button",
    interactionData: {},
    timestamp: 1697054873000,
  },
} satisfies NodeDefinition;

export default definition;
