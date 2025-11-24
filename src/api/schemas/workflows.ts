import { z } from "@/lib/zod";

// Node related schemas
export const nodeTypeSchema = z.enum(["trigger", "action"]);
export type NodeType = z.infer<typeof nodeTypeSchema>;

export const workflowNodeSchema = z.object({
  id: z.string(),
  type: nodeTypeSchema,
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.string(), z.any()),
  inputs: z.array(z.string()).optional(),
  outputs: z.array(z.string()).optional(),
});
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;

export const workflowConnectionSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});
export type WorkflowConnection = z.infer<typeof workflowConnectionSchema>;

// Definition schema
export const workflowDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  urlPattern: z.string().min(1),
  nodes: z.array(workflowNodeSchema),
  connections: z.array(workflowConnectionSchema),
  enabled: z.boolean(),
  variables: z.record(z.string(), z.string()).optional(),
  modifiedAt: z.number().optional(),
});
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;

// Schema for POST body: workflowId, visibility, definition
export const workflowCreateSchema = z.object({
  workflowId: z.string().min(1).max(12),
  definition: workflowDefinitionSchema,
});
export type WorkflowCreateInput = z.infer<typeof workflowCreateSchema>;

export const workflowUpdateSchema = z.object({
  definition: workflowDefinitionSchema.optional(),
});
export type WorkflowUpdateInput = z.infer<typeof workflowUpdateSchema>;

export const WorkflowEntitySchema = z.object({
  workflowId: z.string().length(12),
  definition: workflowDefinitionSchema,
  updatedAt: z.string().transform((val) => new Date(val)),
  createdAt: z.string().transform((val) => new Date(val)),
});

export type WorkflowEntity = z.infer<typeof WorkflowEntitySchema>;

// extends WorkflowEntitySchema with deletedAt
export const DeletedWorkflowEntitySchema = WorkflowEntitySchema.extend({
  deletedAt: z.string().transform((val) => new Date(val)),
});

export type DeletedWorkflowEntity = z.infer<typeof DeletedWorkflowEntitySchema>;
