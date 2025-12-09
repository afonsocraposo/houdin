import { CustomMessage } from "@/lib/messages";
import { AcccountSchema as AccountSchema, Account } from "./schemas/account";
import { WorkflowPullResponse } from "./schemas/pull";
import { WorkflowPushResponse } from "./schemas/push";
import { DeletedWorkflow } from "./schemas/types";
import { WorkflowDefinition, WorkflowTombstone } from "./schemas/workflows";
import { smartFetch } from "./smartFetch";
import browser from "@/services/browser";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://houdin.dev/api";

export class ApiClient {
  static startBackgroundProxy(): void {
    browser.runtime.onMessage.addListener(
      (message: CustomMessage, _sender: any) => {
        if (message.type === "PROXY_FETCH") {
          return (async () => {
            const { url, options } = message.data;
            const response = await fetch(url, options);
            return {
              body: await response.text(),
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              ok: response.ok,
            };
          })();
        }
      },
    );
  }

  static async getAccount(): Promise<Account | null> {
    const response = await smartFetch(`${API_BASE_URL}/account`);
    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error(`Failed to fetch account: ${response.statusText}`);
    }
    const data = (await response.json()).data;
    return AccountSchema.parse(data);
  }

  static async listDeletedWorkflows(): Promise<DeletedWorkflow[]> {
    const url = new URL(`${API_BASE_URL}/workflows/trash`);
    const response = await smartFetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `Failed to fetch deleted workflows: ${response.statusText}`,
      );
    }
    const deleted = (await response.json()).data;
    return deleted as DeletedWorkflow[];
  }

  static async restoreDeletedWorkflow(workflowId: string): Promise<void> {
    const response = await smartFetch(
      `${API_BASE_URL}/workflows/trash/${workflowId}`,
      {
        method: "PATCH",
      },
    );
    if (!response.ok) {
      throw new Error(
        `Failed to restore deleted workflow: ${response.statusText}`,
      );
    }
  }

  static async permanentlyDeleteWorkflow(workflowId: string): Promise<void> {
    const response = await smartFetch(
      `${API_BASE_URL}/workflows/trash/${workflowId}`,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) {
      throw new Error(
        `Failed to permanently delete workflow: ${response.statusText}`,
      );
    }
  }

  static async pullWorkflows(since: number = 0): Promise<WorkflowPullResponse> {
    const response = await smartFetch(
      `${API_BASE_URL}/workflows/pull?since=${since}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to pull workflows: ${response.statusText}`);
    }
    const data = (await response.json()).data;

    return data as WorkflowPullResponse;
  }

  static async pushWorkflows(
    updated: WorkflowDefinition[],
    deleted: WorkflowTombstone[],
  ): Promise<WorkflowPushResponse> {
    const response = await smartFetch(`${API_BASE_URL}/workflows/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ updated, deleted }),
    });
    if (!response.ok) {
      throw new Error(`Failed to push workflows: ${response.statusText}`);
    }

    const data = (await response.json()).data;
    return data as WorkflowPushResponse;
  }

  static async action<T>(actionType: string, payload: any): Promise<T> {
    const response = await smartFetch(`${API_BASE_URL}/actions/${actionType}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const json = await response.json().catch(() => null);
      const error = json?.error?.message;
      switch (response.status) {
        case 400:
          throw new Error(`Bad Request: ${error}`);
        case 401:
          throw new Error(`Unauthorized: ${error}`);
        case 403:
          throw new Error(`Forbidden: ${error}`);
        case 404:
          throw new Error(`Not Found: ${error}`);
        case 426:
          throw new Error(`Upgrade Required: ${error}`);
        case 500:
          throw new Error(`Internal Server Error: ${error}`);
        default:
          throw new Error(`Failed to perform action: ${error}`);
      }
    }
    const data = (await response.json()).data;
    return data as T;
  }
}
