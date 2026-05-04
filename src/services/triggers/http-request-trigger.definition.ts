import type { NodeDefinition } from '../node-definitions/types';
import { selectProperty, textProperty } from '@/types/config-properties';

const definition = {
  kind: "trigger",
  metadata: {
    type: "http-request",
    label: "HTTP Request",
    icon: "IconApi",
    description: "Trigger when an HTTP request matches the specified URL pattern"
},
  configSchema: {
    properties: {
        urlPattern: textProperty({
            label: "URL Pattern",
            placeholder: "https://api.example.com/users",
            description: "URL pattern to match (supports wildcards with *)",
            required: true
        }),
        method: selectProperty({
            label: "HTTP Method",
            options: [
                { value: "ANY", label: "Any Method" },
                { value: "GET", label: "GET" },
                { value: "POST", label: "POST" },
                { value: "PUT", label: "PUT" },
                { value: "DELETE", label: "DELETE" },
                { value: "PATCH", label: "PATCH" },
            ],
            defaultValue: "ANY",
            description: "HTTP method to match"
        })
    }
},
  outputExample: {
    url: "https://api.example.com/users",
    method: "GET",
    headers: { "content-type": "application/json" },
    body: { name: "John Doe" },
},
} satisfies NodeDefinition;

export default definition;
