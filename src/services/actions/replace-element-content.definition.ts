import type { NodeDefinition } from '../node-definitions/types';
import { selectProperty, textProperty, textareaProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "replace-element-content",
    label: "Replace Element Content",
    icon: "🔄",
    description: "Replace the content of a page element"
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
        description: "Type of selector to use for element selection",
        required: true
      }),
      elementSelector: textProperty({
        label: "Element Selector",
        placeholder: ".title, #content, h1",
        description: "Selector for the element whose content will be replaced",
        required: true,
        defaultValue: "h1"
      }),
      newContent: textareaProperty({
        label: "New Content",
        placeholder: "<p>New content here</p>",
        description: "The new HTML content to set on the element",
        required: true,
        defaultValue: ""
      })
    }
  },
  outputExample: {
    previousContent: "<span>Old content</span>",
    newContent: "<p>New content here</p>",
  },
} satisfies NodeDefinition;

export default definition;
