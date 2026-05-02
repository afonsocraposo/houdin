import type { NodeDefinition } from '../node-definitions/types';
import { textareaProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "create-variable",
    label: "Create Variable",
    icon: "🔄",
    description: "Create a variable by merging other variables or processing with Liquid syntax"
},
  configSchema: {
    properties: {
        value: textareaProperty({
            label: "Variable Value",
            placeholder: "Hello {{user.name}}, you have {{orders.length}} orders.\nTotal: ${{orders | map: 'total' | sum}}",
            description: "Value using Liquid syntax. Use {{nodeId}} to reference outputs from other actions, or {{nodeId.property}} for specific properties",
            rows: 4,
            required: true
        })
    }
},
  outputExample: "Hello John, you have 3 orders. Total: $150",
} satisfies NodeDefinition;

export default definition;
