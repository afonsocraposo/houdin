import type { NodeDefinition } from '../node-definitions/types';
import { booleanProperty, textProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "write-clipboard",
    label: "Write to Clipboard",
    icon: "📋",
    description: "Copy text to clipboard"
},
  configSchema: {
    properties: {
        text: textProperty({
            label: "Text to Copy",
            description: "Text content to write to clipboard",
            required: true
        }),
        richText: booleanProperty({
            label: "Rich Text",
            description: "Preserve HTML so rich text editors can paste formatted content",
            required: false,
            defaultValue: false
        })
    }
},
  outputExample: {
    text: "This text was copied from the element.",
},
} satisfies NodeDefinition;

export default definition;
