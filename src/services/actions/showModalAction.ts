import { BaseAction, ActionMetadata } from "@/types/actions";
import { textProperty, textareaProperty } from "@/types/config-properties";
import { ModalService } from "@/services/modal";

interface ShowModalActionConfig {
  modalTitle: string;
  modalContent: string;
}

interface ShowModalActionOutput {
  title: string;
  content: string;
}

export class ShowModalAction extends BaseAction<ShowModalActionConfig, ShowModalActionOutput> {
  static readonly metadata: ActionMetadata = {
    type: "show-modal",
    label: "Show Modal",
    icon: "💬",
    description: "Display modal with content",
  };

  readonly configSchema = {
    properties: {
      modalTitle: textProperty({
        label: "Modal Title",
        placeholder: "Information, {{node-id}} Data",
        description:
          "Title of the modal. Use {{node-id}} to reference action outputs",
        defaultValue: "Workflow Result",
      }),
      modalContent: textareaProperty({
        label: "Modal Content",
        placeholder: "The extracted content is: {{get-content-node}}",
        description:
          "Content to display. Use {{node-id}} to reference action outputs. Supports Markdown.",
        rows: 4,
      }),
    },
  };

  readonly outputExample = {
    title: "Workflow Result",
    content: "The extracted content is: Example content",
  };

  async execute(
    config: ShowModalActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: ShowModalActionOutput) => void,
    _onError: (error: Error) => void,
  ): Promise<void> {
    const { modalTitle, modalContent } = config;

    // Show the modal
    ModalService.showModal({
      title: modalTitle,
      content: modalContent,
    });

    onSuccess({
      title: modalTitle,
      content: modalContent,
    });
  }
}
