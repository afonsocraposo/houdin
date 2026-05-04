import type { NodeDefinition } from '../node-definitions/types';
import { textProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "input",
    label: "Input",
    icon: "💬",
    description: "Request input from the user via a modal dialog",
    disableTimeout: true
},
  configSchema: {
    properties: {
        prompt: textProperty({
            label: "Prompt",
            placeholder: "Please provide your input",
            description: "The message to display in the input modal"
        })
    }
},
  outputExample: {
    prompt: "Please provide your input",
    input: "User provided value",
},
} satisfies NodeDefinition;

export default definition;
