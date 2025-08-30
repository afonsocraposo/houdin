import { TriggerRegistry } from "./triggerRegistry";
import { PageLoadTrigger } from "./triggers/pageLoadTrigger";
import { ComponentLoadTrigger } from "./triggers/componentLoadTrigger";
import { DelayTrigger } from "./triggers/delayTrigger";
import { KeyPressTrigger } from "./triggers/onKeyPressTrigger";
import { HttpRequestTrigger } from "./triggers/httpRequestTrigger";
import { ButtonClickTrigger } from "./triggers/buttonClickTrigger";

// Initialize and register all triggers
export function initializeTriggers(): void {
  const registry = TriggerRegistry.getInstance();

  // Register all built-in triggers
  registry.register(new PageLoadTrigger());
  registry.register(new ComponentLoadTrigger());
  registry.register(new DelayTrigger());
  registry.register(new KeyPressTrigger());
  registry.register(new HttpRequestTrigger());
  registry.register(new ButtonClickTrigger());
}

// Export for convenience
export { TriggerRegistry } from "./triggerRegistry";
