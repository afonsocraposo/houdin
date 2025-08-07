import { BaseTrigger, TriggerConfigSchema, TriggerExecutionContext, TriggerSetupResult } from '../../types/triggers';

export class DelayTrigger extends BaseTrigger {
  readonly metadata = {
    type: 'delay',
    label: 'Delay',
    icon: '⏱️',
    description: 'Triggers after a specified delay'
  };

  getConfigSchema(): TriggerConfigSchema {
    return {
      properties: {
        delay: {
          type: 'number',
          label: 'Delay (milliseconds)',
          placeholder: '1000',
          description: 'Time to wait before triggering in milliseconds',
          required: true,
          min: 0,
          defaultValue: 1000
        }
      }
    };
  }

  getDefaultConfig(): Record<string, any> {
    return {
      delay: 1000
    };
  }

  async setup(
    config: Record<string, any>,
    _context: TriggerExecutionContext,
    onTrigger: () => Promise<void>
  ): Promise<TriggerSetupResult> {
    const delay = config.delay;
    
    const timeoutId = window.setTimeout(async () => {
      await onTrigger();
    }, delay);

    return {
      cleanup: () => {
        clearTimeout(timeoutId);
      }
    };
  }
}