import { nodeCatalog } from "../src/services/nodeCatalog";
import type { NodeDefinitionRecord } from "../src/services/node-definitions/types";
import fs from "fs";

function sanitizeForJson(obj: unknown): unknown {
  if (obj instanceof Set) {
    return [...obj];
  }
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForJson);
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeForJson(value);
    }
    return result;
  }
  return obj;
}

const output: Record<string, Record<string, unknown>> = {
  actions: {},
  triggers: {},
};

for (const [type, definition] of Object.entries(nodeCatalog.actions)) {
  const def = definition as NodeDefinitionRecord;
  output.actions[type] = sanitizeForJson({
    metadata: def.metadata,
    configSchema: def.configSchema,
    outputExample: def.outputExample,
  });
}

for (const [type, definition] of Object.entries(nodeCatalog.triggers)) {
  const def = definition as NodeDefinitionRecord;
  output.triggers[type] = sanitizeForJson({
    metadata: def.metadata,
    configSchema: def.configSchema,
    outputExample: def.outputExample,
  });
}

// write to json file
fs.writeFileSync(
  "dist/node-definitions.json",
  JSON.stringify(output, null, 2),
  "utf-8",
);
