import { BaseTrigger, TriggerConfigSchema, TriggerExecutionContext, TriggerSetupResult } from '../../types/triggers';

export class PageLoadTrigger extends BaseTrigger {
  readonly metadata = {
    type: 'page-load',
    label: 'Page Load',
    icon: '🌐',
    description: 'Triggers when the page is loaded'
  };

  getConfigSchema(): TriggerConfigSchema {
    return {
      properties: {}
    };
  }

  getDefaultConfig(): Record<string, any> {
    return {};
  }

  async setup(
    _config: Record<string, any>,
    _context: TriggerExecutionContext,
    onTrigger: () => Promise<void>
  ): Promise<TriggerSetupResult> {
    // Page is already loaded when this is called, so trigger immediately
    await onTrigger();
    
    // No cleanup needed for page load trigger
    return {};
  }
}