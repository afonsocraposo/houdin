import type { NodeDefinition } from '../node-definitions/types';
import { selectProperty, textProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "remove-element",
    label: "Remove Element",
    icon: "❌",
    description: "Remove on a page element"
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
            description: "Selector for the element to remove",
            required: true,
            defaultValue: "button"
        })
    }
},
  outputExample: {
    element: '<div id="ad-banner">Ad Content</div>',
},
} satisfies NodeDefinition;

export default definition;
