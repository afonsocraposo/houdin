import { AcccountSchema as AccountSchema, Account } from "./schemas/account";
import { WorkflowPullResponse } from "./schemas/pull";
import { WorkflowPushResponse } from "./schemas/push";
import { DeletedWorkflow } from "./schemas/types";
import { WorkflowDefinition, WorkflowTombstone } from "./schemas/workflows";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://houdin.dev/api";

export class ApiClient {
  static async getAccount(): Promise<Account | null> {
    const response = await fetch(`${API_BASE_URL}/account`, {
      credentials: "include",
    });
    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error(`Failed to fetch account: ${response.statusText}`);
    }
    const data = (await response.json()).data;
    return AccountSchema.parse(data);
  }

  async listDeletedWorkflows(): Promise<DeletedWorkflow[]> {
    const url = new URL(`${API_BASE_URL}/workflows/trash`);
    const response = await fetch(url, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch deleted workflows: ${response.statusText}`,
      );
    }
    const deleted = (await response.json()).data;
    return deleted as DeletedWorkflow[];
  }

  async restoreDeletedWorkflow(workflowId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/workflows/trash/${workflowId}`,
      {
        method: "PATCH",
        credentials: "include",
      },
    );
    if (!response.ok) {
      throw new Error(
        `Failed to restore deleted workflow: ${response.statusText}`,
      );
    }
  }

  async permanentlyDeleteWorkflow(workflowId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/workflows/trash/${workflowId}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );
    if (!response.ok) {
      throw new Error(
        `Failed to permanently delete workflow: ${response.statusText}`,
      );
    }
  }

  static async pullWorkflows(since: number = 0): Promise<WorkflowPullResponse> {
    const response = await fetch(
      `${API_BASE_URL}/workflows/pull?since=${since}`,
      {
        credentials: "include",
      },
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
    const response = await fetch(`${API_BASE_URL}/workflows/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ updated, deleted }),
    });
    if (!response.ok) {
      throw new Error(`Failed to push workflows: ${response.statusText}`);
    }

    const data = (await response.json()).data;
    return data as WorkflowPushResponse;
  }
}
