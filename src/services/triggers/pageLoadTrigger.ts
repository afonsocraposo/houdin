import {
  BaseTrigger,
  TriggerConfigSchema,
  TriggerExecutionContext,
  TriggerSetupResult,
} from "../../types/triggers";

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
    _context: TriggerExecutionContext,
    onTrigger: (data?: any) => Promise<void>,
  ): Promise<TriggerSetupResult> {
    console.log("Setting up Page Load Trigger");
    // Page is already loaded when this is called, so trigger immediately
    await onTrigger({ url: window.location.href });

    // No cleanup needed for page load trigger
    return {};
  }
}
