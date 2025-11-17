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

  static async listWorkflows(): Promise<Workflow[]> {
    const response = await fetch(`${API_BASE_URL}/workflows`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch workflows: ${response.statusText}`);
    }
    const workflows = (await response.json()).data;
    return workflows.map((wf: any) => {
      const parsedWorkflow = workflowCreateSchema.parse(wf);
      console.log("Parsed workflow from API:", parsedWorkflow);
      return {
        id: parsedWorkflow.workflowId,
        ...parsedWorkflow.definition,
      };
    });
  }

  static async createWorkflow(
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
}
