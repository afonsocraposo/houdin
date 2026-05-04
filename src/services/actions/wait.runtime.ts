import definition from "./wait.definition";
import { BaseAction } from "@/types/actions";
interface WaitActionConfig {
  duration: number; // Duration in milliseconds
}

interface WaitActionOutput {
  duration: number;
  timestamp: number;
}

export class WaitAction extends BaseAction<WaitActionConfig, WaitActionOutput> {
  constructor() {
    super(definition);
  }

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
