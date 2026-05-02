import type { NodeDefinition } from '../node-definitions/types';
import { booleanProperty, codeProperty, colorProperty, customProperty, selectProperty, textProperty, textareaProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "inject-component",
    label: "Inject Component",
    icon: "💉",
    description: "Inject a custom component into the page (text, HTML)"
},
  configSchema: {
    properties: {
        // Component preview
        preview: customProperty({
            label: "Component Preview",
            component: "InjectComponentPreview"
        }),
        selectorType: selectProperty({
            label: "Selector Type",
            options: [
                { label: "CSS Selector", value: "css" },
                { label: "XPath", value: "xpath" },
            ],
            defaultValue: "css",
            description: "Type of selector to use for component injection",
            required: true
        }),
        targetSelector: textProperty({
            label: "Target Selector",
            placeholder: ".header, #main-content",
            description: "Where to inject the component (not needed for floating action button)",
            defaultValue: "body"
        }),
        injectionPosition: selectProperty({
            label: "Position",
            options: [
                { value: "start", label: "Start (prepend)" },
                { value: "end", label: "End (append)" },
            ],
            defaultValue: "end",
            description: "Where to inject the component within the target element"
        }),
        componentType: selectProperty({
            label: "Component Type",
            options: [
                {
                    value: "text",
                    label: "Text/Label"
                },
                { value: "html", label: "HTML" },
            ],
            defaultValue: "text"
        }),
        componentText: textareaProperty({
            label: "Text Content",
            placeholder: "Click me, Enter text, etc.",
            defaultValue: "Hello",
            showWhen: {
                field: "componentType",
                value: "text"
            }
        }),
        componentHtml: codeProperty({
            language: "html",
            label: "HTML Content",
            placeholder: "<b>Hello</b>, <i>world</i>!",
            defaultValue: "<b>Hello</b>, <i>world</i>!",
            showWhen: {
                field: "componentType",
                value: "html"
            }
        }),
        // Text-specific properties
        textColor: colorProperty({
            label: "Text Color",
            description: "Color of the text",
            defaultValue: "#000000",
            showWhen: {
                field: "componentType",
                value: "text"
            }
        }),
        useMarkdown: booleanProperty({
            label: "Enable Markdown",
            description: "Render text as markdown (supports **bold**, *italic*, links, lists, etc.)",
            defaultValue: true,
            showWhen: {
                field: "componentType",
                value: "text"
            }
        }),
        // Advanced styling (for all types)
        customStyle: codeProperty({
            label: "Custom CSS (Advanced)",
            placeholder: "margin: 10px; border-radius: 4px;",
            description: "Additional CSS properties.",
            language: "text",
            height: 100,
            showWhen: {
                field: "componentType",
                value: ["text"]
            }
        })
    }
},
  outputExample: {
    componentType: "text",
    component: "Hello, world!",
    injected: true,
    text: "Hello, world!",
    customStyle: "color: red; font-weight: bold;",
},
} satisfies NodeDefinition;

export default definition;
