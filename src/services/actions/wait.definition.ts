import type { NodeDefinition } from '../node-definitions/types';
import { numberProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "wait",
    label: "Wait",
    icon: "⏳",
    description: "Wait for a specified duration before proceeding (delay)",
    disableTimeout: true
},
  configSchema: {
    properties: {
        duration: numberProperty({
            label: "Duration (s)",
            description: "Duration to wait in seconds",
            required: true,
            min: 0,
            defaultValue: 1
        })
    }
},
  outputExample: {
    duration: 1,
    timestamp: 1640995200000,
},
} satisfies NodeDefinition;

export default definition;
