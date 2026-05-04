import type { NodeDefinitionRecord } from "@/services/node-definitions/types";
import { actions } from "@/services/node-definitions/actions";
import { triggers } from "@/services/node-definitions/triggers";

export const actionCatalog: NodeDefinitionRecord = actions;
export const triggerCatalog: NodeDefinitionRecord = triggers;

export const nodeCatalog = {
  actions: actionCatalog,
  triggers: triggerCatalog,
};

export function getNodeDefinition(kind: "action" | "trigger", type: string) {
  return kind === "action" ? actionCatalog[type] : triggerCatalog[type];
}
