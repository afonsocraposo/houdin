import type { NodeDefinition } from '../node-definitions/types';
import { customProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "fill-form",
    label: "Fill Form",
    icon: "IconForms",
    description: "Fill out multiple fields in a form",
    disableTimeout: true
},
  configSchema: {
    properties: {
        fields: customProperty({
            label: "Form Fields",
            description: "Define the fields to fill in the form and their values",
            defaultValue: [
                {
                    selectorType: "label",
                    selector: "",
                    value: ""
                },
            ],
            component: "FillFormBuilder"
        })
    }
},
  outputExample: {
    fields: [
        {
            selectorType: "placeholder",
            selector: "email@example.com",
            value: "email@example.com",
            success: true,
            error: undefined,
        },
        {
            selectorType: "label",
            selector: "Password",
            value: "password123",
            success: false,
            error: "Element not found",
        },
    ],
    _timestamp: Date.now(),
},
} satisfies NodeDefinition;

export default definition;
