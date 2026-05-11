import definition from "./page-load.definition";
import { BaseTrigger } from "@/types/triggers";
interface PageLoadTriggerConfig {
  // Empty config for page load trigger
}

interface PageLoadTriggerOutput {
  url: string;
}

export class PageLoadTrigger extends BaseTrigger<PageLoadTriggerConfig, PageLoadTriggerOutput> {
  private firedUrls = new Map<string, string>();

  constructor() {
    super(definition);
  }

  async setup(
    _config: PageLoadTriggerConfig,
    workflowId: string,
    nodeId: string,
    onTrigger: (data: PageLoadTriggerOutput) => Promise<void>,
  ): Promise<(() => void) | void> {
    // Page is already loaded when this is called, so trigger immediately
    const activeKey = `${workflowId}:${nodeId}`;
    const url = window.location.href;

    if (this.firedUrls.get(activeKey) !== url) {
      this.firedUrls.set(activeKey, url);
      await onTrigger({ url });
    }

    return () => {
      if (window.location.href !== url) {
        this.firedUrls.delete(activeKey);
      }
    };
  }
}
