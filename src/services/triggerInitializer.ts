import { TriggerRegistry } from './triggerRegistry';
import { PageLoadTrigger } from './triggers/pageLoadTrigger';
import { ComponentLoadTrigger } from './triggers/componentLoadTrigger';
import { DelayTrigger } from './triggers/delayTrigger';

// Initialize and register all triggers
export function initializeTriggers(): void {
  const registry = TriggerRegistry.getInstance();

  // Register all built-in triggers
  registry.register(new PageLoadTrigger());
  registry.register(new ComponentLoadTrigger());
  registry.register(new DelayTrigger());
}

// Export for convenience
export { TriggerRegistry } from './triggerRegistry';