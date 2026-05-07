import { WorkflowDefinition } from "@/types/workflow";
import { newWorkflowId } from "./helpers";

export function createBlankWorkflow(workflowId?: string): WorkflowDefinition {
  return {
    id: workflowId || newWorkflowId(),
    name: "",
    description: "",
    urlPattern: "https://*",
    nodes: [],
    connections: [],
    enabled: true,
    variables: {},
    modifiedAt: Date.now(),
  };
}
