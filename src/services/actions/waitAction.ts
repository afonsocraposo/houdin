import { BaseAction, ActionMetadata } from "@/types/actions";
import { numberProperty } from "@/types/config-properties";

interface WaitActionConfig {
  duration: number; // Duration in milliseconds
}

interface WaitActionOutput {
  duration: number;
  timestamp: number;
}

export class WaitAction extends BaseAction<WaitActionConfig, WaitActionOutput> {
  static readonly metadata: ActionMetadata = {
    type: "wait",
    label: "Wait",
    icon: "⏳",
    description: "Wait for a specified duration before proceeding (delay)",
    disableTimeout: true,
  };

  readonly configSchema = {
    properties: {
      duration: numberProperty({
        label: "Duration (s)",
        description: "Duration to wait in seconds",
        required: true,
        min: 0,
        defaultValue: 1,
      }),
    },
  };

  readonly outputExample = {
    duration: 1,
    timestamp: 1640995200000,
  };

  async execute(
    config: WaitActionConfig,
    _workflowId: string,
    _nodeId: string,
    onSuccess: (data: WaitActionOutput) => void,
    _onError: (error: Error) => void,
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, config.duration * 1000));
    onSuccess({ duration: config.duration, timestamp: Date.now() });
  }
}
