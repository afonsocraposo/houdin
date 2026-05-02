import type { NodeDefinitionRecord } from "@/services/node-definitions/types";
import { actions } from "@/services/node-definitions/actions";
import { triggers } from "@/services/node-definitions/triggers";

export const actionCatalog: NodeDefinitionRecord = actions;
export const triggerCatalog: NodeDefinitionRecord = triggers;

export const nodeCatalog = {
  actions: actionCatalog,
  triggers: triggerCatalog,
};

export function getNodeCatalogSummaries(): Array<{
  kind: "action" | "trigger";
  type: string;
  label: string;
  description: string;
  fields: Array<{ name: string; type: string; required: boolean; defaultValue?: any }>;
}> {
  return [...Object.values(actions), ...Object.values(triggers)].map((entry) => ({
    kind: entry.kind,
    type: entry.metadata.type,
    label: entry.metadata.label,
    description: entry.metadata.description,
    fields: Object.entries(entry.configSchema.properties).map(([name, property]) => ({
      name,
      type: property.type,
      required: Boolean(property.required),
      defaultValue: property.defaultValue,
    })),
  }));
}
