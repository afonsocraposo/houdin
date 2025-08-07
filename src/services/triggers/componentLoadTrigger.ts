import { BaseTrigger, TriggerConfigSchema, TriggerExecutionContext, TriggerSetupResult } from '../../types/triggers';

interface ComponentLoadTriggerConfig {
  selector: string;
}

export class ComponentLoadTrigger extends BaseTrigger<ComponentLoadTriggerConfig> {
  readonly metadata = {
    type: 'component-load',
    label: 'Component Load',
    icon: '🎯',
    description: 'Trigger when specific element appears'
  };

  getConfigSchema(): TriggerConfigSchema {
    return {
      properties: {
        selector: {
          type: 'text',
          label: 'CSS Selector',
          placeholder: '.my-element, #my-id, [data-testid="test"]',
          description: 'CSS selector for the element to watch for',
          required: true
        }
      }
    };
  }

  getDefaultConfig(): ComponentLoadTriggerConfig {
    return {
      selector: ''
    };
  }

  async setup(
    config: ComponentLoadTriggerConfig,
    _context: TriggerExecutionContext,
    onTrigger: () => Promise<void>
  ): Promise<TriggerSetupResult> {
    const selector = config.selector;
    
    // Check if element already exists
    const existingElement = document.querySelector(selector);
    if (existingElement) {
      await onTrigger();
      return {};
    }

    // Set up observer to watch for element
    const observer = new MutationObserver(async (mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const element = document.querySelector(selector);
          if (element) {
            observer.disconnect();
            await onTrigger();
            return;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Clean up after 30 seconds to prevent memory leaks
    const timeoutId = window.setTimeout(() => {
      observer.disconnect();
      console.log(`Component load trigger timed out for selector: ${selector}`);
    }, 30000);

    return {
      cleanup: () => {
        observer.disconnect();
        clearTimeout(timeoutId);
      }
    };
  }
}