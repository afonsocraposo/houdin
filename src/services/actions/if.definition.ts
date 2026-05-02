import type { NodeDefinition } from '../node-definitions/types';
import { selectProperty, textProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "if",
    label: "If Comparison",
    description: "Perform a comparison between two values with true/false outputs",
    icon: "IconArrowFork",
    outputs: new Set(["true", "false"])
},
  configSchema: {
    properties: {
        a: textProperty({
            label: "Left Operand (A)",
            placeholder: "Enter left operand",
            description: "The left operand for comparison",
            required: true
        }),
        operator: selectProperty({
            label: "Operator",
            options: ["==", "!=", "<", "<=", ">", ">=", "contains"],
            defaultValue: "==",
            description: "Comparison operator",
            required: true
        }),
        b: textProperty({
            label: "Right Operand (B)",
            placeholder: "Enter right operand",
            description: "The right operand for comparison",
            required: true
        })
    }
},
  outputExample: {
    a: "value1",
    b: "value2",
    operator: "==",
    result: true,
},
} satisfies NodeDefinition;

export default definition;
