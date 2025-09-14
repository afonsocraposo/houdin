import {
  BaseAction,
  ActionConfigSchema,
  ActionMetadata,
} from "@/types/actions";

interface WaitActionConfig {
  duration: number; // Duration in milliseconds
}

export class WaitAction extends BaseAction<WaitActionConfig> {
  readonly metadata: ActionMetadata = {
    type: "wait",
    label: "Wait",
    icon: "⏳",
    description: "Wait for a specified duration before proceeding",
    disableTimeout: true,
  };

  getConfigSchema(): ActionConfigSchema {
    return {
      properties: {
        duration: {
          type: "number",
          label: "Duration (s)",
          description: "Duration to wait in seconds",
          required: true,
          min: 0,
          defaultValue: 3,
        },
      },
    };
  }

  async execute(
    config: WaitActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data?: any) => void,
    _onError: (error: Error) => void,
  ): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, config.duration * 1000);
    });
    onSuccess({ duration: config.duration, timestamp: Date.now() });
  }
}
