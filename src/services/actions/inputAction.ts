import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "@/types/actions";
import { ModalService } from "@/services/modal";

interface InputActionConfig {
  prompt: string;
}

export class InputAction extends BaseAction<InputActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "input",
    label: "Input",
    icon: "💬",
    description: "Request input from the user via a modal dialog",
    disableTimeout: true,
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        prompt: {
          type: "text",
          label: "Prompt",
          placeholder: "Please provide your input",
          description: "The message to display in the input modal",
        },
      },
    };
  }

  async execute(
    config: InputActionConfig,
    _workflowId: string,
    nodeId: string,
    onSuccess: (data?: any) => void,
    _onError: (error: Error) => void,
  ): Promise<void> {
    const { prompt } = config;

    // Show the modal
    try {
      const id = `${nodeId}-${Date.now()}`;
      const detail = await ModalService.showInputModal(id, {
        title: prompt,
      });

      onSuccess({
        prompt,
        input: detail.input,
      });
    } catch (error) {
      _onError(error as Error);
    }
  }
}
