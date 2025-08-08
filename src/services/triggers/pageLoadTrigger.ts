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
    onTrigger: () => Promise<void>,
  ): Promise<TriggerSetupResult> {
    // Page is already loaded when this is called, so trigger immediately
    await onTrigger();

    // No cleanup needed for page load trigger
    return {};
  }
}
