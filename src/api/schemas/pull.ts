import { WorkflowDefinition } from "@/types/workflow";
import { WorkflowTombstone } from "./workflows";

export type WorkflowPullResponse = {
  serverTime: number;
  updated: WorkflowDefinition[];
  deleted: WorkflowTombstone[];
};
