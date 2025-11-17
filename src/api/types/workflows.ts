import { z } from "@/lib/zod";

// Visibility enum via zod
export const visibilitySchema = z.enum(["public", "unlisted", "private"]);
export type Visibility = z.infer<typeof visibilitySchema>;

// Node related schemas
export const nodeTypeSchema = z.enum(["trigger", "action"]);
export type NodeType = z.infer<typeof nodeTypeSchema>;

export const workflowNodeSchema = z.object({
  id: z.string(),
  type: nodeTypeSchema,
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object(),
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
  variables: z.object(),
});
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;

// Schema for POST body: workflowId, visibility, definition
export const workflowCreateSchema = z.object({
  workflowId: z.string().length(12),
  visibility: visibilitySchema.optional().default("unlisted"),
  definition: workflowDefinitionSchema,
});
export type WorkflowCreateInput = z.infer<typeof workflowCreateSchema>;
