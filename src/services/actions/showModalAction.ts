import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "@/types/actions";
import { ModalService } from "@/services/modal";

interface ShowModalActionConfig {
  modalTitle: string;
  modalContent: string;
}

export class ShowModalAction extends BaseAction<ShowModalActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "show-modal",
    label: "Show Modal",
    icon: "💬",
    description: "Display modal with content",
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        modalTitle: {
          type: "text",
          label: "Modal Title",
          placeholder: "Information, {{node-id}} Data",
          description:
            "Title of the modal. Use {{node-id}} to reference action outputs",
          defaultValue: "Workflow Result",
        },
        modalContent: {
          type: "textarea",
          label: "Modal Content",
          placeholder: "The extracted content is: {{get-content-node}}",
          description:
            "Content to display. Use {{node-id}} to reference action outputs. Supports Markdown.",
          rows: 4,
        },
      },
    };
  }

  async execute(
    config: ShowModalActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
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
