import type { NodeDefinition } from '../node-definitions/types';
import { customProperty } from '@/types/config-properties';

const definition = {
  kind: "trigger",
  metadata: {
    type: "key-press",
    label: "Key Press",
    icon: "⌨️",
    description: "Trigger when a specific key combination is pressed"
},
  configSchema: {
    properties: {
        keyCombo: customProperty({
            label: "Key Combination",
            description: "Set the key combination that will trigger this workflow",
            required: true,
            component: "KeybindingSetter"
        })
    }
},
  outputExample: {
    keyCombo: "Ctrl + Enter",
    timestamp: 1640995200000,
},
} satisfies NodeDefinition;

export default definition;
