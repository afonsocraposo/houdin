import { WorkflowDefinition } from "@/types/workflow";

export type OutboxAction = "create" | "update" | "delete";

export type WorkflowOutboxMessage =
  | {
      workflowId: string;
      action: "create" | "update";
      timestamp: number;
      workflow: WorkflowDefinition;
    }
  | {
      workflowId: string;
      action: "delete";
      timestamp: number;
    };
