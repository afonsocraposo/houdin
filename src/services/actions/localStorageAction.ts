import { BaseAction, ActionMetadata } from "@/types/actions";
import { selectProperty, textProperty } from "@/types/config-properties";

interface LocalStorageActionConfig {
  operation: "create" | "read" | "update" | "delete" | "list" | "clear";
  key?: string; // Key for create, read, update, delete operations
  value?: string; // Value for create and update operations
}

interface LocalStorageActionOutput {
  key?: string;
  value?: string | null;
  operation: string;
  data?: Record<string, string>;
  cleared?: number;
}

export class LocalStorageAction extends BaseAction<
  LocalStorageActionConfig,
  LocalStorageActionOutput
> {
  static readonly metadata: ActionMetadata = {
    type: "local-storage",
    label: "Local Storage",
    icon: "🗄️",
    description:
      "Create, read, update, and delete items in the browser's local storage",
  };

  configSchema = {
    properties: {
      operation: selectProperty({
        label: "Operation",
        description: "The operation to perform on local storage",
        options: [
          { label: "List", value: "list" },
          { label: "Create", value: "create" },
          { label: "Read", value: "read" },
          { label: "Update", value: "update" },
          { label: "Delete", value: "delete" },
          { label: "Clear", value: "clear" },
        ],
        defaultValue: "read",
      }),
      key: textProperty({
        label: "Key",
        description: "The key of the item in local storage",
        placeholder: "foo",
        showWhen: {
          field: "operation",
          value: ["create", "read", "update", "delete"],
        },
        required: true,
      }),
      value: textProperty({
        label: "Value",
        description: "The value to store in local storage",
        placeholder: "bar",
        showWhen: {
          field: "operation",
          value: ["create", "update"],
        },
        required: true,
      }),
    },
  };

  readonly outputExample = {
    key: "foo",
    value: "bar",
    operation: "read",
    data: { foo: "bar", baz: "qux" },
    cleared: 2,
  };

  async execute(
    config: LocalStorageActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { operation, key, value } = config;
    try {
      switch (operation) {
        case "create":
        case "update":
          if (!key || !value) {
            onError(new Error("Key and value are required for operation."));
            return;
          }
          localStorage.setItem(key, value);
          onSuccess({ key, value, operation });
          return;
        case "read":
          if (!key) {
            onError(new Error("Key is required for read operation."));
            return;
          }
          const readValue = localStorage.getItem(key);
          onSuccess({ key, value: readValue, operation });
          return;
        case "delete":
          if (!key) {
            onError(new Error("Key is required for delete operation."));
            return;
          }
          localStorage.removeItem(key);
          onSuccess({ key, operation });
          return;
        case "clear":
          const l = localStorage.length;
          localStorage.clear();
          onSuccess({ operation, cleared: l });
          return;
        case "list":
          const data = Object.assign({}, localStorage);
          onSuccess({ data, operation });
      }
    } catch (error) {
      onError(error as Error);
    }
  }
}
