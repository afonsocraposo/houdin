import type { NodeDefinition } from '../node-definitions/types';
import { booleanProperty, codeProperty, credentialsProperty, numberProperty, selectProperty, textProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "http-request",
    label: "HTTP Request",
    icon: "IconWorld",
    description: "Make HTTP request to any URL with custom headers and body",
    disableTimeout: true
},
  configSchema: {
    properties: {
        method: selectProperty({
            label: "HTTP Method",
            options: [
                { label: "GET", value: "GET" },
                { label: "POST", value: "POST" },
                { label: "PUT", value: "PUT" },
                { label: "PATCH", value: "PATCH" },
                { label: "DELETE", value: "DELETE" },
            ],
            defaultValue: "GET",
            description: "HTTP method to use for the request",
            required: true
        }),
        url: textProperty({
            label: "URL",
            placeholder: "https://api.example.com/data",
            description: "Target URL for the HTTP request. Variables like {{node-id}} can be used",
            required: true
        }),
        contentType: selectProperty({
            label: "Content Type",
            options: [
                { label: "JSON (application/json)", value: "application/json" },
                {
                    label: "Form Data (application/x-www-form-urlencoded)",
                    value: "application/x-www-form-urlencoded"
                },
                { label: "Plain Text (text/plain)", value: "text/plain" },
                { label: "Custom", value: "custom" },
            ],
            defaultValue: "application/json",
            description: "Content-Type header for the request",
            showWhen: {
                field: "method",
                value: ["POST", "PUT", "PATCH"]
            }
        }),
        customContentType: textProperty({
            label: "Custom Content Type",
            placeholder: "application/xml",
            description: "Custom Content-Type header value",
            showWhen: {
                field: "contentType",
                value: "custom"
            }
        }),
        headers: codeProperty({
            label: "Headers (JSON)",
            placeholder: '{\n  "Authorization": "Bearer {{auth-token}}",\n  "X-Custom-Header": "value"\n}',
            description: "Additional HTTP headers as JSON object. Variables like {{node-id}} can be used",
            language: "json",
            height: 150
        }),
        body: codeProperty({
            label: "Request Body",
            placeholder: '{\n  "name": "{{user-input}}",\n  "email": "user@example.com"\n}',
            description: "Request body content. Variables like {{node-id}} can be used",
            language: "json",
            height: 200,
            showWhen: {
                field: "method",
                value: ["POST", "PUT", "PATCH"]
            }
        }),
        credentialId: credentialsProperty({
            credentialType: "http",
            label: "HTTP Credential (Optional)",
            placeholder: "Select HTTP credential for authentication",
            description: "Optional HTTP credential for authentication",
            required: false
        }),
        timeout: numberProperty({
            label: "Timeout (seconds)",
            placeholder: "30",
            description: "Request timeout in seconds (default: 30)",
            min: 1,
            max: 300,
            defaultValue: 30
        }),
        followRedirects: booleanProperty({
            label: "Follow Redirects",
            description: "Whether to follow HTTP redirects",
            defaultValue: true
        })
    }
},
  outputExample: {
    status: 200,
    statusText: "OK",
    headers: {
        "content-type": "application/json",
        "x-custom-header": "value",
    },
    data: {
        id: 123,
        name: "Sample Data",
    },
    url: "https://api.example.com/data",
},
} satisfies NodeDefinition;

export default definition;
