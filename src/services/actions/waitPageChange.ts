import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "../../types/actions";

interface WaitPageChangeConfig {}

export class WaitPageChangeAction extends BaseAction<WaitPageChangeConfig> {
  readonly metadata: ActionMetadata = {
    type: "wait-page-change",
    label: "Wait page change",
    icon: "⏳",
    description: "Wait for the page to change before proceeding",
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {},
    };
  }

  async execute(
    _config: WaitPageChangeConfig,
    _context: any,
    _nodeId: string,
    _onSuccess: (data?: any) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    setTimeout(() => {
      onError(new Error("Page never changed"));
    }, 5000);
  }
}
