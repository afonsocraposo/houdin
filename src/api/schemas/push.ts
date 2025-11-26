import { WorkflowDefinition } from "@/types/workflow";
import { WorkflowTombstone } from "./workflows";

export interface WorkflowPush {
  updated: WorkflowDefinition[];
  deleted: WorkflowTombstone[];
}
