import { Account } from "./types/account";
import { Visibility, workflowCreateSchema } from "./types/workflows";
import { WorkflowDefinition as Workflow } from "@/types/workflow";

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
    return Account.parse(await response.json());
  }

  async listWorkflows(lastSync?: number): Promise<Workflow[]> {
    const url = new URL(`${API_BASE_URL}/workflows`);
    if (lastSync) {
      url.searchParams.append("updatedAfter", lastSync.toString());
    }
    const response = await fetch(url, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch workflows: ${response.statusText}`);
    }
    const workflows = (await response.json()).data;
    return workflows.map((wf: any) => {
      const parsedWorkflow = workflowCreateSchema.parse(wf);
      return {
        id: parsedWorkflow.workflowId,
        ...parsedWorkflow.definition,
      };
    });
  }

  async listMissingWorkflowIds(
    localWorkflowIds: Set<string>,
  ): Promise<string[]> {
    console.log(localWorkflowIds);
    const response = await fetch(`${API_BASE_URL}/workflows/missing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        workflowIds: Array.from(localWorkflowIds).map((id) => id.slice(-12)),
      }),
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch missing workflows: ${response.statusText}`,
      );
    }
    const json = await response.json();
    return json.data.missing;
  }

  async createWorkflow(
    workflow: Workflow,
    visibility: Visibility = "unlisted",
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/workflows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        workflowId: workflow.id.slice(-12),
        definition: workflow,
        visibility,
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to create workflow: ${response.statusText}`);
    }
    return (await response.json()).data;
  }

  async updateWorkflow(workflow: Workflow): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/workflows/${workflow.id.slice(-12)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          definition: workflow,
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to update workflow: ${response.statusText}`);
    }
    return (await response.json()).data;
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/workflows/${workflowId.slice(-12)}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to delete workflow: ${response.statusText}`);
    }
  }
}
