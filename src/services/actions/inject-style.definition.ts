import type { NodeDefinition } from '../node-definitions/types';
import { codeProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "inject-style",
    label: "Inject Style",
    icon: "🎨",
    description: "Inject custom CSS styles"
},
  configSchema: {
    properties: {
        customStyle: codeProperty({
            label: "Custom CSS",
            placeholder: "body { background-color: lightblue; } .my-class { color: red; }",
            description: "CSS code to inject into the page.",
            language: "css",
            height: 200,
            required: true
        })
    }
},
  outputExample: {
    customStyle: "body { background-color: lightblue; }",
},
} satisfies NodeDefinition;

export default definition;
