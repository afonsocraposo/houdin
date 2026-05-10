import type { NodeDefinition } from "../node-definitions/types";
import { selectProperty, textProperty } from "@/types/config-properties";

const definition = {
  kind: "action",
  metadata: {
    type: "get-element-content",
    label: "Get Element Content",
    icon: "📖",
    description:
      "Extract content from a page element. You can specify the format of the content (text, markdown, or HTML) and the type of selector to locate the element.",
  },
  configSchema: {
    properties: {
      selectorType: selectProperty({
        label: "Selector Type",
        options: [
          { label: "CSS Selector", value: "css" },
          { label: "XPath", value: "xpath" },
          { label: "Text", value: "text" },
        ],
        defaultValue: "css",
        description: "Type of selector to use for element extraction",
        required: true,
      }),
      selector: textProperty({
        label: "Selector",
        placeholder: ".title, #content, h1",
        description: "Selector for the element to extract content from",
        required: true,
        defaultValue: "h1",
      }),
      format: selectProperty({
        label: "Content Format",
        options: [
          { label: "Text", value: "text" },
          { label: "Markdown", value: "markdown" },
          { label: "HTML", value: "html" },
        ],
        defaultValue: "text",
        description: "Format of the extracted content",
        required: true,
      }),
    },
  },
  outputExample: {
    content: "This text was extracted from the element.",
  },
} satisfies NodeDefinition;

export default definition;
