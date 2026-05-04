import type { NodeDefinition } from '../node-definitions/types';
import { numberProperty } from '@/types/config-properties';

const definition = {
  kind: "trigger",
  metadata: {
    type: "delay",
    label: "Delay",
    icon: "⏱️",
    description: "Triggers after a specified delay"
},
  configSchema: {
    properties: {
        delay: numberProperty({
            label: "Delay (seconds)",
            placeholder: "1",
            description: "Time to wait before triggering in seconds",
            required: true,
            min: 0,
            defaultValue: 1
        })
    }
},
  outputExample: {
    delay: 1,
    timestamp: 1640995200000,
},
} satisfies NodeDefinition;

export default definition;
