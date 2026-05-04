import type { NodeDefinition } from '../node-definitions/types';
import { numberProperty, selectProperty, textProperty } from '@/types/config-properties';

const definition = {
  kind: "trigger",
  metadata: {
    type: "component-load",
    label: "Component Load",
    icon: "🎯",
    description: "Trigger when specific element appears"
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
        selector: textProperty({
            label: "CSS Selector",
            placeholder: '.my-element, #my-id, [data-testid="test"]',
            description: "Selector for the element to watch for",
            required: true
        }),
        timeout: numberProperty({
            label: "Timeout (seconds)",
            placeholder: "30",
            description: "How long to wait before showing error (default: 30s)",
            defaultValue: 30
        })
    }
},
  outputExample: {
    element: '<div class="loaded-element">Content</div>',
},
} satisfies NodeDefinition;

export default definition;
