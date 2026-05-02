import type { NodeDefinition } from '../node-definitions/types';
const definition = {
  kind: "action",
  metadata: {
    type: "paste-clipboard",
    label: "Paste from Clipboard",
    icon: "📥",
    description: "Paste clipboard contents into the focused field"
},
  configSchema: {
    properties: {}
},
  outputExample: {
    text: "Pasted clipboard text",
    html: "<a href=\"https://example.com\">Pasted clipboard text</a>",
},
} satisfies NodeDefinition;

export default definition;
