import definition from "./session-storage.definition";
import { BaseAction } from "@/types/actions";
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
  constructor() {
    super(definition);
  }

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
          if (readValue === null) {
            onError(
              new Error(`No item found in session storage for key: ${key}`),
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
