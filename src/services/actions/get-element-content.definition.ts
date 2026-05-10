import type { NodeDefinition } from '../node-definitions/types';
import { booleanProperty, selectProperty, textProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "get-element-content",
    label: "Get Element Content",
    icon: "📖",
    description: "Extract text content from page element"
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
            required: true
        }),
        selector: textProperty({
            label: "Selector",
            placeholder: ".title, #content, h1",
            description: "Selector for the element to extract content from",
            required: true,
            defaultValue: "h1"
        }),
        getInnerHTML: booleanProperty({
            label: "Get Inner HTML",
            description: "When enabled, returns innerHTML instead of text content",
            defaultValue: false
        })
    }
},
  outputExample: {
    content: "This text was extracted from the element.",
},
} satisfies NodeDefinition;

export default definition;
