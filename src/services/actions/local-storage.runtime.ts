import definition from "./local-storage.definition";
import { BaseAction } from "@/types/actions";
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
  constructor() {
    super(definition);
  }

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
          if (readValue === null) {
            onError(
              new Error(`No value found in local storage for key: ${key}`),
            );
            return;
          }
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
