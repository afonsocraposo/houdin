import type { NodeDefinition } from '../node-definitions/types';
import { codeProperty, customProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "custom-script",
    label: "Custom Script",
    icon: "⚡",
    description: "Execute custom JavaScript code"
},
  configSchema: {
    properties: {
        permissionCheck: customProperty({
            label: "Permission Status",
            component: "PermissionButton"
        }),
        customScript: codeProperty({
            label: "Custom JavaScript",
            placeholder: "// Access workflow context variables:\n// const prevResult = {{nodeId}}; // Get output from another node\n\nalert('Hello World!');\nconsole.log('Custom script executed');\n\n// Use Return(data) to send data to next actions\n// Return({ message: 'Success', foo: 'bar' });",
            description: "JavaScript code to execute. Use {{nodeId}} to access variables from other nodes. Use Return(data) to send data to next actions.",
            language: "javascript",
            height: 200,
            required: true
        })
    }
},
  outputExample: {
    message: "Success",
    foo: "bar",
},
} satisfies NodeDefinition;

export default definition;
