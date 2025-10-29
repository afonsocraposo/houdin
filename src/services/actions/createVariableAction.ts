import { BaseAction, ActionMetadata } from "@/types/actions";
import { textareaProperty } from "@/types/config-properties";

interface CreateVariableActionConfig {
  value: string;
}

type CreateVariableActionOutput = string;

export class CreateVariableAction extends BaseAction<
  CreateVariableActionConfig,
  CreateVariableActionOutput
> {
  static readonly metadata: ActionMetadata = {
    type: "create-variable",
    label: "Create Variable",
    icon: "🔄",
    description:
      "Create a variable by merging other variables or processing with Liquid syntax",
  };

  readonly configSchema = {
    properties: {
      value: textareaProperty({
        label: "Variable Value",
        placeholder:
          "Hello {{user.name}}, you have {{orders.length}} orders.\nTotal: ${{orders | map: 'total' | sum}}",
        description:
          "Value using Liquid syntax. Use {{nodeId}} to reference outputs from other actions, or {{nodeId.property}} for specific properties",
        rows: 4,
        required: true,
      }),
    },
  };

  readonly outputExample = "Hello John, you have 3 orders. Total: $150";

  async execute(
    config: CreateVariableActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: CreateVariableActionOutput) => void,
    _onError: (error: Error) => void,
  ): Promise<void> {
    const { value } = config;
    onSuccess(value);
  }
}
