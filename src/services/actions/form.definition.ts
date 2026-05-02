import type { NodeDefinition } from '../node-definitions/types';
import { customProperty, textProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "form",
    label: "Form",
    icon: "📝",
    description: "Show a form to collect user input",
    disableTimeout: true
},
  configSchema: {
    properties: {
        title: textProperty({
            label: "Form Title",
            placeholder: "Enter form title",
            description: "Title of the form to display to the user"
        }),
        fields: customProperty({
            label: "Form Fields",
            description: "Define the fields to collect user input",
            defaultValue: [
                {
                    name: "",
                    label: "",
                    type: "text",
                    required: false,
                    placeholder: "",
                    defaultValue: ""
                },
            ],
            component: "FormBuilder"
        })
    }
},
  outputExample: {
    email: "email@example.com",
    password: "password123",
    _timestamp: Date.now(),
},
} satisfies NodeDefinition;

export default definition;
