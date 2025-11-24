import { AcccountSchema as AccountSchema, Account } from "./schemas/account";
import { DeletedWorkflow } from "./schemas/types";
import {
  DeletedWorkflowEntitySchema,
  WorkflowDefinition,
  workflowDefinitionSchema,
  WorkflowEntitySchema,
} from "./schemas/workflows";
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
    const data = (await response.json()).data;
    return AccountSchema.parse(data);
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
      const parsedWorkflow = WorkflowEntitySchema.parse(wf);
      return {
        id: `workflow-${parsedWorkflow.workflowId}`,
        name: parsedWorkflow.definition.name,
        description: parsedWorkflow.definition.description,
        urlPattern: parsedWorkflow.definition.urlPattern,
        enabled: parsedWorkflow.definition.enabled,
        nodes: parsedWorkflow.definition.nodes as any,
        connections: parsedWorkflow.definition.connections as any,
        variables: parsedWorkflow.definition.variables,
        modifiedAt: parsedWorkflow.updatedAt.getTime(),
      } as Workflow;
    });
  }

  async listAllWorkflows(): Promise<Workflow[]> {
    const allWorkflows: Workflow[] = [];
    let after: string | undefined = undefined;
    while (true) {
      const url = new URL(`${API_BASE_URL}/workflows`);
      if (after) {
        url.searchParams.append("after", after);
      }
      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch all workflows: ${response.statusText}`,
        );
      }
      const responseJson = await response.json();
      const workflows = responseJson.data;
      allWorkflows.push(
        ...workflows.map((wf: any) => {
          const parsedWorkflow = WorkflowEntitySchema.parse(wf);
          return {
            id: `workflow-${parsedWorkflow.workflowId}`,
            name: parsedWorkflow.definition.name,
            description: parsedWorkflow.definition.description,
            urlPattern: parsedWorkflow.definition.urlPattern,
            enabled: parsedWorkflow.definition.enabled,
            nodes: parsedWorkflow.definition.nodes as any,
            connections: parsedWorkflow.definition.connections as any,
            variables: parsedWorkflow.definition.variables,
            modifiedAt: parsedWorkflow.updatedAt.getTime(),
          } as Workflow;
        }),
      );
      if (!responseJson.meta.hasMore) {
        break;
      } else {
        after = responseJson.meta.next;
      }
    }
    return allWorkflows;
  }

  async listDeletedWorkflows(lastSync?: number): Promise<DeletedWorkflow[]> {
    const url = new URL(`${API_BASE_URL}/workflows/trash`);
    if (lastSync) {
      url.searchParams.append("deletedAfter", lastSync.toString());
    }
    const response = await fetch(url, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch deleted workflows: ${response.statusText}`,
      );
    }
    const workflows = (await response.json()).data;
    return workflows.map((wf: any) => {
      const parsedWorkflow = DeletedWorkflowEntitySchema.parse(wf);
      return {
        id: `workflow-${parsedWorkflow.workflowId}`,
        name: parsedWorkflow.definition.name,
        description: parsedWorkflow.definition.description,
        urlPattern: parsedWorkflow.definition.urlPattern,
        nodes: parsedWorkflow.definition.nodes.length,
        deletedAt: parsedWorkflow.deletedAt.getTime(),
      } as DeletedWorkflow;
    });
  }

  async restoreDeletedWorkflow(workflowId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/workflows/trash/${workflowId.slice(-12)}`,
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
      `${API_BASE_URL}/workflows/trash/${workflowId.slice(-12)}`,
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

  /** @deprecated Use listWorkflows instead */
  async listWorkflowsId(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/workflows/workflowId`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch missing workflows: ${response.statusText}`,
      );
    }
    const json = await response.json();
    return json.data.map((id: string) => `workflow-${id}`);
  }

  async createWorkflow(workflow: Workflow): Promise<WorkflowDefinition> {
    const definition = workflowDefinitionSchema.parse(workflow);
    const response = await fetch(`${API_BASE_URL}/workflows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        workflowId: workflow.id.slice(-12),
        definition,
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to create workflow: ${response.statusText}`);
    }
    const data = (await response.json()).data;
    return (
      workflowDefinitionSchema.safeParse(data.definition).data ||
      (data as WorkflowDefinition)
    );
  }

  async updateWorkflow(workflow: Workflow): Promise<any> {
    const definition = workflowDefinitionSchema.parse(workflow);
    const response = await fetch(
      `${API_BASE_URL}/workflows/${workflow.id.slice(-12)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          definition,
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to update workflow: ${response.statusText}`);
    }
    const data = (await response.json()).data;
    return (
      workflowDefinitionSchema.safeParse(data.definition).data ||
      (data as WorkflowDefinition)
    );
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
