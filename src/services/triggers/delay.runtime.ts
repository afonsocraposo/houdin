import definition from "./delay.definition";
import { BaseTrigger } from "@/types/triggers";
interface DelayTriggerConfig {
  delay: number;
}

interface DelayTriggerOutput {
  delay: number;
  timestamp: number;
}

export class DelayTrigger extends BaseTrigger<DelayTriggerConfig, DelayTriggerOutput> {
  constructor() {
    super(definition);
  }

  async setup(
    config: DelayTriggerConfig,
    _workflowId: string,
    _nodeId: string,
    onTrigger: (data: DelayTriggerOutput) => Promise<void>,
  ): Promise<() => void> {
    const delay = config.delay;

    const timeoutId = window.setTimeout(async () => {
      await onTrigger({ delay, timestamp: Date.now() });
    }, delay * 1000);

    return () => clearTimeout(timeoutId);
  }
}
