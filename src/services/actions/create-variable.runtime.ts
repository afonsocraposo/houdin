import definition from "./create-variable.definition";
import { BaseAction } from "@/types/actions";
interface CreateVariableActionConfig {
  value: string;
}

type CreateVariableActionOutput = string;

export class CreateVariableAction extends BaseAction<
  CreateVariableActionConfig,
  CreateVariableActionOutput
> {
  constructor() {
    super(definition);
  }

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
