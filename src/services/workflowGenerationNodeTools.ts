import { tool } from "ai";
import { z } from "zod";

import {
  type ConfigProperty,
  type ConfigSchema,
} from "@/types/config-properties";
import type { WorkflowDefinition } from "@/types/workflow";
import {
  actionCatalog,
  getNodeDefinition,
  triggerCatalog,
} from "./nodeCatalog";

type WorkflowNodeToolContext = {
  getWorkflow: () => WorkflowDefinition;
  createNode: (args: Record<string, any>) => {
    workflow: WorkflowDefinition;
    result: string;
  };
  commitWorkflow: (workflow: WorkflowDefinition, message: string) => void;
};

function configPropertyToZod(property: ConfigProperty) {
  switch (property.type) {
    case "text":
    case "password":
    case "textarea":
    case "code":
    case "credentials":
    case "custom":
      return z.string();
    case "number": {
      let schema = z.number();
      if (property.min !== undefined) schema = schema.min(property.min);
      if (property.max !== undefined) schema = schema.max(property.max);
      return schema;
    }
    case "boolean":
      return z.boolean();
    case "color":
      return z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
    case "select": {
      const values = property.options.map((option) =>
        typeof option === "string" ? option : option.value,
      );
      return values.length > 0
        ? z.enum(values as [string, ...string[]])
        : z.string();
    }
    default:
      return z.any();
  }
}

function buildInputSchema(configSchema: ConfigSchema) {
  const shape: Record<string, z.ZodTypeAny> = {
    position: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .optional(),
  };

  for (const [key, property] of Object.entries(configSchema.properties)) {
    const propertySchema = configPropertyToZod(property).describe(
      property.description || property.label,
    );

    if (property.required && property.defaultValue === undefined) {
      shape[key] = propertySchema;
    } else {
      shape[key] = propertySchema.optional();
    }
  }

  return z.object(shape);
}

function pickConfigValues(
  args: Record<string, any>,
  configSchema: ConfigSchema,
): Record<string, any> {
  const config: Record<string, any> = {};

  for (const key of Object.keys(configSchema.properties)) {
    if (args[key] !== undefined) {
      config[key] = args[key];
    }
  }

  return config;
}

export function buildWorkflowNodeTools({
  getWorkflow,
  createNode,
  commitWorkflow,
}: WorkflowNodeToolContext): Record<string, any> {
  const tools: Record<string, any> = {};

  for (const entry of [
    ...Object.values(triggerCatalog),
    ...Object.values(actionCatalog),
  ]) {
    tools[entry.metadata.type] = tool({
      description: `Create a ${entry.metadata.label} node.`,
      inputSchema: buildInputSchema(entry.configSchema),
      execute: async (args: Record<string, any>) => {
        const workflow = getWorkflow();
        const config = pickConfigValues(args, entry.configSchema);

        const { workflow: nextWorkflow, result } = createNode({
          type: entry.metadata.type,
          nodeType: entry.kind,
          id: args.id,
          position: args.position,
          inputs: args.inputs,
          outputs: args.outputs,
          config,
        });

        commitWorkflow(
          nextWorkflow,
          `Created ${entry.kind} node '${nextWorkflow.nodes[nextWorkflow.nodes.length - 1]?.id ?? entry.metadata.type}' (${entry.metadata.type}).`,
        );
        return { message: result, workflowId: workflow.id };
      },
    });
  }

  return tools;
}

export function getNodeSchema(kind: "action" | "trigger", type: string) {
  return getNodeDefinition(kind, type)?.configSchema ?? null;
}
