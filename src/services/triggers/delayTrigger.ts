import { BaseTrigger, TriggerConfigSchema } from "@/types/triggers";

interface DelayTriggerConfig {
  delay: number;
}

export class DelayTrigger extends BaseTrigger<DelayTriggerConfig> {
  readonly metadata = {
    type: "delay",
    label: "Delay",
    icon: "⏱️",
    description: "Triggers after a specified delay",
  };

  getConfigSchema(): TriggerConfigSchema {
    return {
      properties: {
        delay: {
          type: "number",
          label: "Delay (seconds)",
          placeholder: "1",
          description: "Time to wait before triggering in seconds",
          required: true,
          min: 0,
          defaultValue: 1,
        },
      },
    };
  }
  async setup(
    config: DelayTriggerConfig,
    _workflowId: string,
    _nodeId: string,
    onTrigger: (data?: any) => Promise<void>,
  ): Promise<void> {
    const delay = config.delay;

    const timeoutId = window.setTimeout(async () => {
      await onTrigger({ delay, timestamp: Date.now() });
      clearTimeout(timeoutId);
    }, delay * 1000);
  }
}
