import definition from "./page-load.definition";
import { BaseTrigger } from "@/types/triggers";
interface PageLoadTriggerConfig {
  // Empty config for page load trigger
}

interface PageLoadTriggerOutput {
  url: string;
}

export class PageLoadTrigger extends BaseTrigger<PageLoadTriggerConfig, PageLoadTriggerOutput> {
  constructor() {
    super(definition);
  }

  async setup(
    _config: PageLoadTriggerConfig,
    _workflowId: string,
    _nodeId: string,
    onTrigger: (data: PageLoadTriggerOutput) => Promise<void>,
  ): Promise<(() => void) | void> {
    await onTrigger({ url: window.location.href });
  }
}
