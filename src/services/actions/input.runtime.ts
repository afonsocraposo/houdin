import definition from "./input.definition";
import { BaseAction } from "@/types/actions";
import { ModalService } from "@/services/modal";
interface InputActionConfig {
  prompt: string;
}

interface InputActionOutput {
  prompt: string;
  input: string;
}

export class InputAction extends BaseAction<
  InputActionConfig,
  InputActionOutput
> {
  constructor() {
    super(definition);
  }

  async execute(
    config: InputActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: InputActionOutput) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const { prompt } = config;

    // Show the modal
    try {
      const detail = await ModalService.showInputModal({
        title: prompt,
      });

      onSuccess({
        prompt,
        input: detail.input,
      });
    } catch (error) {
      onError(error as Error);
    }
  }
}
