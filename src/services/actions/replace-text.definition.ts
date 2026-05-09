import type { NodeDefinition } from '../node-definitions/types';
import { booleanProperty, selectProperty, textProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "replace-text",
    label: "Replace Text",
    icon: "🔤",
    description: "Find and replace text on the page"
  },
  configSchema: {
    properties: {
      searchText: textProperty({
        label: "Search Text",
        placeholder: "Text to find",
        description: "The text string to search for",
        required: true,
        defaultValue: ""
      }),
      replaceWith: textProperty({
        label: "Replace With",
        placeholder: "Replacement text",
        description: "The text to replace matches with",
        required: true,
        defaultValue: ""
      }),
      scope: selectProperty({
        label: "Scope",
        options: [
          { label: "Entire Page", value: "page" },
          { label: "Specific Element", value: "element" },
        ],
        defaultValue: "page",
        description: "Where to perform the replacement",
        required: true
      }),
      selectorType: selectProperty({
        label: "Selector Type",
        options: [
          { label: "CSS Selector", value: "css" },
          { label: "XPath", value: "xpath" },
          { label: "Text", value: "text" },
        ],
        defaultValue: "css",
        description: "Type of selector to use for element selection",
        required: true,
        showWhen: { field: "scope", value: "element" }
      }),
      elementSelector: textProperty({
        label: "Element Selector",
        placeholder: ".title, #content, h1",
        description: "Selector for the element to search within",
        required: true,
        defaultValue: "",
        showWhen: { field: "scope", value: "element" }
      }),
      caseSensitive: booleanProperty({
        label: "Case Sensitive",
        description: "When enabled, matching is case-sensitive",
        defaultValue: true
      })
    }
  },
  outputExample: {
    replacedCount: 3,
  },
} satisfies NodeDefinition;

export default definition;
