import type { ConfigSchema } from '@/types/config-properties';
import type { BaseMetadata } from '@/types/base';
import type { NodeType } from '@/types/workflow';

export interface NodeDefinition {
  kind: NodeType;
  metadata: BaseMetadata & {
    disableTimeout?: boolean;
    outputs?: Set<string>;
    hidden?: boolean;
  };
  configSchema: ConfigSchema;
  outputExample: unknown;
}

export type NodeDefinitionRecord = Record<string, NodeDefinition>;
