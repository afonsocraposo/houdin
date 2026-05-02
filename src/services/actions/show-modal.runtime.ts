import definition from "./show-modal.definition";
import { BaseAction } from "@/types/actions";
import { ModalService } from "@/services/modal";
interface ShowModalActionConfig {
  modalTitle: string;
  modalContent: string;
}

interface ShowModalActionOutput {
  title: string;
  content: string;
}

export class ShowModalAction extends BaseAction<
  ShowModalActionConfig,
  ShowModalActionOutput
> {
  constructor() {
    super(definition);
  }

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
