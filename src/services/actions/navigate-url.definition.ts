import type { NodeDefinition } from '../node-definitions/types';
import { textProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "navigate-url",
    label: "Navigate to URL",
    icon: "IconExternalLink",
    description: "Navigate to a specific URL"
},
  configSchema: {
    properties: {
        url: textProperty({
            label: "URL destination",
            description: "The URL to navigate to",
            placeholder: "https://afonsoraposo.com",
            required: true
        })
    }
},
  outputExample: {
    url: "https://afonsoraposo.com",
},
} satisfies NodeDefinition;

export default definition;
