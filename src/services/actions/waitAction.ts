import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "../../types/actions";

interface WaitActionConfig {
  duration: number; // Duration in milliseconds
}

export class WaitAction extends BaseAction<WaitActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "wait",
    label: "Wait",
    icon: "⏳",
    description: "Wait for a specified duration before proceeding",
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        duration: {
          type: "number",
          label: "Duration (ms)",
          defaultValue: "1000",
          description: "Duration to wait in milliseconds",
          required: true,
        },
      },
    };
  }

  async execute(
    config: WaitActionConfig,
    _context: any,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    _onError: (error: Error) => void,
  ): Promise<void> {
    setTimeout(() => {
      onSuccess({ message: `Waited for ${config.duration} ms` });
    }, config.duration);
  }
}
