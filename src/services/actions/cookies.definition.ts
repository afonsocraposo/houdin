import type { NodeDefinition } from '../node-definitions/types';
import { numberProperty, selectProperty, textProperty } from '@/types/config-properties';

const definition = {
  kind: "action",
  metadata: {
    type: "cookies",
    label: "Cookies",
    icon: "🍪",
    description: "Create, read, update, and delete items in the browser's cookies"
},
  configSchema: {
    properties: {
        operation: selectProperty({
            label: "Operation",
            description: "The operation to perform on cookies",
            options: [
                { label: "List", value: "list" },
                { label: "Create", value: "create" },
                { label: "Read", value: "read" },
                { label: "Exists", value: "exists" },
                { label: "Update", value: "update" },
                { label: "Delete", value: "delete" },
                { label: "Clear", value: "clear" },
            ],
            defaultValue: "list"
        }),
        key: textProperty({
            label: "Key",
            description: "The key of the item in cookies",
            placeholder: "foo",
            showWhen: {
                field: "operation",
                value: ["create", "read", "exists", "update", "delete"]
            },
            required: true
        }),
        value: textProperty({
            label: "Value",
            description: "The value to store in cookies",
            placeholder: "bar",
            showWhen: {
                field: "operation",
                value: ["create", "update"]
            },
            required: true
        }),
        ttl: numberProperty({
            label: "TTL",
            description: "Time to live in seconds. If set, the cookie will expire after this time.",
            placeholder: "3600",
            showWhen: {
                field: "operation",
                value: ["create", "update"]
            },
            required: false
        })
    }
},
  outputExample: {
    key: "foo",
    value: {
        domain: null,
        expires: 1775846367000,
        partitioned: false,
        path: "/",
        sameSite: "lax",
        secure: false,
        value: "bar",
    },
    operation: "read",
    data: {
        foo: {
            domain: null,
            expires: 1775846367000,
            partitioned: false,
            path: "/",
            sameSite: "lax",
            secure: false,
            value: "bar",
        },
    },
    cleared: 3,
    ttl: 3600,
},
} satisfies NodeDefinition;

export default definition;
