import { BaseTrigger } from "@/types/triggers";
import { numberProperty } from "@/types/config-properties";

interface DelayTriggerConfig {
  delay: number;
}

interface DelayTriggerOutput {
  delay: number;
  timestamp: number;
}

export class DelayTrigger extends BaseTrigger<DelayTriggerConfig, DelayTriggerOutput> {
  readonly metadata = {
    type: "delay",
    label: "Delay",
    icon: "⏱️",
    description: "Triggers after a specified delay",
  };

  readonly configSchema = {
    properties: {
      delay: numberProperty({
        label: "Delay (seconds)",
        placeholder: "1",
        description: "Time to wait before triggering in seconds",
        required: true,
        min: 0,
        defaultValue: 1,
      }),
    },
  };

  readonly outputExample = {
    delay: 1,
    timestamp: 1640995200000,
  };
  async setup(
    config: DelayTriggerConfig,
    _workflowId: string,
    _nodeId: string,
    onTrigger: (data: DelayTriggerOutput) => Promise<void>,
  ): Promise<void> {
    const delay = config.delay;

    const timeoutId = window.setTimeout(async () => {
      await onTrigger({ delay, timestamp: Date.now() });
      clearTimeout(timeoutId);
    }, delay * 1000);
  }
}
