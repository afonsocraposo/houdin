import { BaseAction, ActionMetadata } from "@/types/actions";
import { textProperty } from "@/types/config-properties";
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
  static readonly metadata: ActionMetadata = {
    type: "input",
    label: "Input",
    icon: "💬",
    description: "Request input from the user via a modal dialog",
    disableTimeout: true,
  };

  static readonly configSchema = {
    properties: {
      prompt: textProperty({
        label: "Prompt",
        placeholder: "Please provide your input",
        description: "The message to display in the input modal",
      }),
    },
  };

  readonly outputExample = {
    prompt: "Please provide your input",
    input: "User provided value",
  };

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
