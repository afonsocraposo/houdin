import type { NodeDefinition } from '../node-definitions/types';
const definition = {
  kind: "trigger",
  metadata: {
    type: "page-load",
    label: "Page Load",
    icon: "📄",
    description: "Trigger when page finishes loading"
},
  configSchema: {
    properties: {}
},
  outputExample: {
    url: "https://example.com/page",
},
} satisfies NodeDefinition;

export default definition;
