import type { NodeDefinition } from '../node-definitions/types';
import { booleanProperty, textProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "open-url",
    label: "Open URL",
    icon: "IconExternalLink",
    description: "Open a URL in a new tab"
},
  configSchema: {
    properties: {
        url: textProperty({
            label: "URL destination",
            description: "The URL to open",
            placeholder: "https://afonsoraposo.com",
            required: true
        }),
        focus: booleanProperty({
            label: "Focus tab",
            description: "Whether to focus the new tab after opening",
            defaultValue: true
        })
    }
},
  outputExample: {
    url: "https://afonsoraposo.com",
},
} satisfies NodeDefinition;

export default definition;
