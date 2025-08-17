import { BaseTrigger, TriggerConfigSchema } from "../../types/triggers";

interface PageLoadTriggerConfig {
  // Empty config for page load trigger
}

export class PageLoadTrigger extends BaseTrigger<PageLoadTriggerConfig> {
  readonly metadata = {
    type: "page-load",
    label: "Page Load",
    icon: "📄",
    description: "Trigger when page finishes loading",
  };

  getConfigSchema(): TriggerConfigSchema {
    return {
      properties: {},
    };
  }

  async setup(
    _config: PageLoadTriggerConfig,
    _workflowId: string,
    _nodeId: string,
    onTrigger: (data?: any) => Promise<void>,
  ): Promise<void> {
    // Page is already loaded when this is called, so trigger immediately
    await onTrigger({ url: window.location.href });
  }
}
