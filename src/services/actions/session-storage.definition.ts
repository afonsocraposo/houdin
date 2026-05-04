import type { NodeDefinition } from '../node-definitions/types';
import { selectProperty, textProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "session-storage",
    label: "Session Storage",
    icon: "🗄️",
    description: "Create, read, update, and delete items in the browser's session storage"
},
  configSchema: {
    properties: {
        operation: selectProperty({
            label: "Operation",
            description: "The operation to perform on session storage",
            options: [
                { label: "List", value: "list" },
                { label: "Create", value: "create" },
                { label: "Read", value: "read" },
                { label: "Update", value: "update" },
                { label: "Delete", value: "delete" },
                { label: "Clear", value: "clear" },
            ],
            defaultValue: "list"
        }),
        key: textProperty({
            label: "Key",
            description: "The key of the item in session storage",
            placeholder: "foo",
            showWhen: {
                field: "operation",
                value: ["create", "read", "update", "delete"]
            },
            required: true
        }),
        value: textProperty({
            label: "Value",
            description: "The value to store in session storage",
            placeholder: "bar",
            showWhen: {
                field: "operation",
                value: ["create", "update"]
            },
            required: true
        })
    }
},
  outputExample: {
    key: "foo",
    value: "bar",
    operation: "read",
    data: { foo: "bar", baz: "qux" },
    cleared: 3,
},
} satisfies NodeDefinition;

export default definition;
