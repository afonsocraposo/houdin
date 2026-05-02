import type { NodeDefinition } from '../node-definitions/types';
const definition = {
  kind: "trigger",
  metadata: {
    type: "popup",
    label: "Popup Click",
    icon: "IconBrowserShare",
    description: "Triggers when the workflow is manually executed from the popup"
},
  configSchema: {
    properties: {}
},
  outputExample: {
    timestamp: 1640995200000,
},
} satisfies NodeDefinition;

export default definition;
