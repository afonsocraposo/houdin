import type { NodeDefinition } from "../node-definitions/types";
import { selectProperty, textProperty } from "@/types/config-properties";

const definition = {
  kind: "action",
  metadata: {
    type: "copy-content",
    label: "Copy Content",
    icon: "📋",
    description:
      "Copy content from a page element to the clipboard. You can specify the format of the content (text, markdown, or HTML) and the type of selector to locate the element.",
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
        description: "Type of selector to use for content extraction",
        required: true,
      }),
      selector: textProperty({
        label: "Source Selector",
        placeholder: ".content, #description",
        description: "Element to copy content from",
        required: true,
      }),
      format: selectProperty({
        label: "Content Format",
        options: [
          { label: "Text", value: "text" },
          { label: "Markdown", value: "markdown" },
          { label: "HTML", value: "html" },
        ],
        defaultValue: "text",
        description: "Format of the copied content",
        required: true,
      }),
    },
  },
  outputExample: {
    content: "This text was copied from the element.",
  },
} satisfies NodeDefinition;

export default definition;
