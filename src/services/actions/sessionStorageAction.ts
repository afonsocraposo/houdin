import { BaseAction, ActionMetadata } from "@/types/actions";
import { selectProperty, textProperty } from "@/types/config-properties";

interface SessionStorageActionConfig {
  operation: "create" | "read" | "update" | "delete" | "list" | "clear";
  key?: string; // Key for create, read, update, delete operations
  value?: string; // Value for create and update operations
}

interface SessionStorageActionOutput {
  key?: string;
  value?: string | null;
  operation: string;
  data?: Record<string, string>;
  cleared?: number;
}

export class SessionStorageAction extends BaseAction<
  SessionStorageActionConfig,
  SessionStorageActionOutput
> {
  static readonly metadata: ActionMetadata = {
    type: "session-storage",
    label: "Session Storage",
    icon: "🗄️",
    description:
      "Create, read, update, and delete items in the browser's session storage",
  };

  configSchema = {
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
        defaultValue: "list",
      }),
      key: textProperty({
        label: "Key",
        description: "The key of the item in session storage",
        placeholder: "foo",
        showWhen: {
          field: "operation",
          value: ["create", "read", "update", "delete"],
        },
        required: true,
      }),
      value: textProperty({
        label: "Value",
        description: "The value to store in session storage",
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
    data: undefined,
    cleared: undefined,
  };

  async execute(
    config: SessionStorageActionConfig,
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
          sessionStorage.setItem(key, value);
          onSuccess({ key, value, operation });
          return;
        case "read":
          if (!key) {
            onError(new Error("Key is required for read operation."));
            return;
          }
          const readValue = sessionStorage.getItem(key);
          onSuccess({ key, value: readValue, operation });
          return;
        case "delete":
          if (!key) {
            onError(new Error("Key is required for delete operation."));
            return;
          }
          sessionStorage.removeItem(key);
          onSuccess({ key, operation });
          return;
        case "clear":
          const l = sessionStorage.length;
          sessionStorage.clear();
          onSuccess({ operation, cleared: l });
          return;
        case "list":
          const data = Object.assign({}, sessionStorage);
          onSuccess({ data, operation });
      }
    } catch (error) {
      onError(error as Error);
    }
  }
}
