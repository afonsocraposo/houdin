import type { NodeDefinition } from '../node-definitions/types';
import { selectProperty, textProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "type-text",
    label: "Type Text",
    icon: "⌨️",
    description: "Type text into input field"
},
  configSchema: {
    properties: {
        selectorType: selectProperty({
            label: "Selector Type. (Optional, defaults to focused input)",
            options: [
                { label: "CSS Selector", value: "css" },
                { label: "XPath", value: "xpath" },
                { label: "Text", value: "text" },
                { label: "Placeholder", value: "placeholder" },
                { label: "Label", value: "label" },
                { label: "Focused Input", value: "focused" },
            ],
            defaultValue: "focused",
            description: "Type of selector to use for element selection",
            required: true
        }),
        elementSelector: textProperty({
            label: "Element Selector",
            placeholder: ".title, #content, h1",
            description: "Selector for the element to click",
            required: false,
            defaultValue: "input",
            showWhen: {
                field: "selectorType",
                value: ["css", "xpath", "text", "label", "placeholder"]
            }
        }),
        text: textProperty({
            label: "Text to Type",
            description: "The text that will be typed when this action is executed",
            required: true
        })
    }
},
  outputExample: {
    text: "Hello, World!",
    timestamp: 1640995200000,
},
} satisfies NodeDefinition;

export default definition;
